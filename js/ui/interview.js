/**
 * Interview screen UI
 */
import { getCurrentQuestion, getProgress, isLastQuestion } from '../core/state.js';
import { sanitizeInput } from '../utils.js';

let cameraStream = null;
let speechRecognition = null;
let isListening = false;
let lastSpeechConfidence = null;
let vadStream = null;
let vadAudioContext = null;
let vadAnalyser = null;
let vadFrame = null;
let vadHasDetectedSpeech = false;
let vadLastSpeechAt = 0;
let questionTimerId = null;
let questionSecondsRemaining = 120;

const QUESTION_SECONDS = 120;
const VAD_THRESHOLD = 0.025;
const VAD_SILENCE_MS = 2400;
const VAD_NO_SPEECH_MS = 10000;

export function initInterview() {
  const textarea = document.getElementById('answer-input');
  const submitBtn = document.getElementById('btn-submit-answer');
  const nextBtn = document.getElementById('btn-next-question');
  const cameraBtn = document.getElementById('btn-toggle-camera');
  const voiceBtn = document.getElementById('btn-toggle-voice');
  const readQuestionBtn = document.getElementById('btn-read-question');
  const stopReadingBtn = document.getElementById('btn-stop-reading');

  if (textarea) {
    textarea.addEventListener('input', () => {
      updateAnswerIntegrity();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const text = textarea?.value || '';
      if (text.trim().length < 10) return;
      document.dispatchEvent(new CustomEvent('interview:submit', {
        detail: { answerText: sanitizeInput(text) }
      }));
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('interview:next'));
    });
  }

  if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
      if (cameraStream) {
        stopInterviewCamera();
      } else {
        startInterviewCamera();
      }
    });
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      if (isListening) {
        stopVoiceCapture();
      } else {
        startVoiceCapture();
      }
    });
  }

  if (readQuestionBtn) {
    readQuestionBtn.addEventListener('click', () => speakCurrentQuestion());
  }

  if (stopReadingBtn) {
    stopReadingBtn.addEventListener('click', () => stopQuestionReading());
  }
}

export function renderQuestion(question) {
  if (!question) return;

  const textEl = document.getElementById('question-text');
  const catEl = document.getElementById('question-category');
  const feedback = document.getElementById('feedback-panel');
  const textarea = document.getElementById('answer-input');
  const submitBtn = document.getElementById('btn-submit-answer');

  if (textEl) textEl.textContent = question.text;
  if (catEl) {
    catEl.textContent = question.category || question.type || 'Question';
  }

  // Reset answer area
  if (textarea) {
    textarea.value = '';
    textarea.disabled = false;
  }
  stopVoiceCapture();
  clearVoiceInterim();
  if (submitBtn) submitBtn.disabled = true;
  const counter = document.getElementById('char-count');
  if (counter) counter.textContent = '0 characters';
  setVoiceState('idle', 'Speak your answer and review the transcript before submitting.');

  if (feedback) feedback.classList.add('hidden');

  updateProgressFromState();
  startQuestionTimer();
  speakCurrentQuestion();
  if (!cameraStream) startInterviewCamera();
}

export function updateProgress(current, total) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const percent = Math.round((current / total) * 100);

  if (fill) fill.style.width = `${percent}%`;
  if (text) text.textContent = `Question ${current} of ${total}`;
}

function updateProgressFromState() {
  const { current, total } = getProgress();
  updateProgress(current, total);
}

export function showFeedback(scoreData) {
  const panel = document.getElementById('feedback-panel');
  if (!panel) return;

  panel.classList.remove('hidden');
  panel.classList.add('animate-scale-in');

  // Overall score
  const badge = document.getElementById('overall-score-badge');
  if (badge) {
    badge.textContent = scoreData.overall;
    badge.style.background = scoreColor(scoreData.overall);
  }

  // Category scores
  const catContainer = document.getElementById('category-scores');
  if (catContainer) {
    catContainer.innerHTML = '';
    const labels = {
      technicalAccuracy: 'Technical',
      communication: 'Communication',
      clarity: 'Clarity',
      confidence: 'Confidence',
      problemSolving: 'Problem Solving'
    };
    Object.entries(scoreData.categoryScores).forEach(([key, val]) => {
      const div = document.createElement('div');
      div.className = 'cat-score-item';
      div.innerHTML = `
        <div class="label">${labels[key] || key}</div>
        <div class="value">${val}</div>
      `;
      catContainer.appendChild(div);
    });
  }

  // Strengths
  const strengthsList = document.getElementById('strengths-list');
  if (strengthsList) {
    renderList(strengthsList, scoreData.strengths || []);
  }

  // Improvements
  const improvementsList = document.getElementById('improvements-list');
  if (improvementsList) {
    renderList(improvementsList, scoreData.improvements || []);
  }

  // Disable textarea while feedback is shown
  stopVoiceCapture();
  stopQuestionTimer();
  stopQuestionReading();
  const textarea = document.getElementById('answer-input');
  if (textarea) textarea.disabled = true;
  const submitBtn = document.getElementById('btn-submit-answer');
  if (submitBtn) submitBtn.disabled = true;

  // Update next button text
  const nextBtn = document.getElementById('btn-next-question');
  if (nextBtn) {
    nextBtn.textContent = isLastQuestion() ? 'View Report →' : 'Next Question →';
  }
}

export async function startInterviewCamera() {
  const video = document.getElementById('camera-preview');
  const cameraBtn = document.getElementById('btn-toggle-camera');

  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraState('error', 'Camera is not supported in this browser.');
    return;
  }

  try {
    setCameraState('loading', 'Requesting camera permission...');
    if (cameraBtn) cameraBtn.disabled = true;

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    if (video) {
      video.srcObject = cameraStream;
      await video.play();
    }

    setCameraState('active', 'Camera on. Practice looking at the lens while answering.');
  } catch (err) {
    cameraStream = null;
    console.error(err);
    setCameraState('error', cameraErrorMessage(err));
  } finally {
    if (cameraBtn) cameraBtn.disabled = false;
  }
}

export function stopInterviewCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  const video = document.getElementById('camera-preview');
  if (video) {
    video.pause();
    video.srcObject = null;
  }

  setCameraState('off', 'Camera off. Start it again whenever you want to rehearse visually.');
}

export function stopInterviewSessionTools() {
  stopVoiceCapture();
  stopInterviewCamera();
  stopQuestionTimer();
  stopQuestionReading();
}

function setCameraState(state, message) {
  const panel = document.querySelector('.camera-panel');
  const status = document.getElementById('camera-status');
  const cameraBtn = document.getElementById('btn-toggle-camera');

  panel?.classList.toggle('is-active', state === 'active');
  panel?.classList.toggle('is-error', state === 'error');

  if (status) status.textContent = message;
  if (cameraBtn) {
    cameraBtn.textContent = state === 'active' ? 'Stop Camera' : 'Start Camera';
    cameraBtn.classList.toggle('active', state === 'active');
  }
}

function cameraErrorMessage(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Camera permission was blocked. Allow camera access in your browser to use preview.';
  }
  if (err?.name === 'NotFoundError') {
    return 'No camera was found on this device.';
  }
  if (err?.name === 'NotReadableError') {
    return 'The camera is already in use by another app.';
  }
  return 'Could not start the camera. Check browser permissions and try again.';
}

export function startVoiceCapture() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    setVoiceState('error', 'Voice recognition is not supported in this browser. Try Chrome or Edge.');
    return;
  }

  if (isListening) return;

  speechRecognition = new Recognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';

  speechRecognition.onstart = () => {
    isListening = true;
    vadHasDetectedSpeech = false;
    vadLastSpeechAt = performance.now();
    setVoiceState('listening', 'Listening. Start speaking when ready.');
    startVadMonitor().then((vadReady) => {
      if (vadReady && isListening) {
        setVoiceState('listening', 'Listening with VAD. Start speaking when ready.');
      }
    });
  };

  speechRecognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0]?.transcript || '';

      if (result.isFinal) {
        finalTranscript += transcript;
        lastSpeechConfidence = result[0]?.confidence ?? lastSpeechConfidence;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript.trim()) {
      appendTranscript(finalTranscript);
      updateAnswerIntegrity();
    }

    setVoiceInterim(interimTranscript);
  };

  speechRecognition.onerror = (event) => {
    isListening = false;
    stopVadMonitor();
    setVoiceState('error', voiceErrorMessage(event.error));
  };

  speechRecognition.onend = () => {
    isListening = false;
    speechRecognition = null;
    stopVadMonitor();
    clearVoiceInterim();
    updateAnswerIntegrity();
  };

  try {
    speechRecognition.start();
  } catch (err) {
    console.error(err);
    isListening = false;
    stopVadMonitor();
    setVoiceState('error', 'Could not start voice capture. Try again in a moment.');
  }
}

export function stopVoiceCapture() {
  if (!speechRecognition) {
    isListening = false;
    stopVadMonitor();
    setVoiceButton(false);
    return;
  }

  speechRecognition.stop();
  speechRecognition = null;
  isListening = false;
  stopVadMonitor();
  setVoiceButton(false);
}

async function startVadMonitor() {
  if (!navigator.mediaDevices?.getUserMedia || (!window.AudioContext && !window.webkitAudioContext)) {
    setVoiceState('listening', 'Listening without VAD. Voice transcription is still active.');
    return false;
  }

  try {
    stopVadMonitor();
    vadStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    vadAudioContext = new AudioContextClass();
    const source = vadAudioContext.createMediaStreamSource(vadStream);
    vadAnalyser = vadAudioContext.createAnalyser();
    vadAnalyser.fftSize = 1024;
    source.connect(vadAnalyser);

    monitorVoiceActivity();
    return true;
  } catch (err) {
    console.error(err);
    if (isListening) {
      setVoiceState('listening', `${vadErrorMessage(err)} Voice transcription is still active.`);
    }
    return false;
  }
}

function monitorVoiceActivity() {
  if (!vadAnalyser) return;

  const data = new Uint8Array(vadAnalyser.fftSize);
  const startedAt = performance.now();

  const tick = () => {
    if (!vadAnalyser || !isListening) return;

    vadAnalyser.getByteTimeDomainData(data);
    const rms = calculateRms(data);
    const isSpeaking = rms > VAD_THRESHOLD;
    const now = performance.now();

    updateVadMeter(rms, isSpeaking);

    if (isSpeaking) {
      vadHasDetectedSpeech = true;
      vadLastSpeechAt = now;
      setVoiceState('listening', 'Voice detected. Keep answering naturally.');
    } else if (vadHasDetectedSpeech && now - vadLastSpeechAt > VAD_SILENCE_MS) {
      setVoiceState('ready', 'Silence detected. Voice capture stopped so you can review.');
      stopVoiceCapture();
      return;
    } else if (!vadHasDetectedSpeech && now - startedAt > VAD_NO_SPEECH_MS) {
      setVoiceState('warning', 'No voice detected yet. Check your mic or speak closer to it.');
    } else {
      setVoiceState('listening', 'Listening with VAD. Waiting for speech...');
    }

    vadFrame = requestAnimationFrame(tick);
  };

  tick();
}

function stopVadMonitor() {
  if (vadFrame) {
    cancelAnimationFrame(vadFrame);
    vadFrame = null;
  }

  if (vadStream) {
    vadStream.getTracks().forEach(track => track.stop());
    vadStream = null;
  }

  if (vadAudioContext) {
    vadAudioContext.close().catch(() => {});
    vadAudioContext = null;
  }

  vadAnalyser = null;
  updateVadMeter(0, false);
}

function calculateRms(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const normalized = (data[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
}

function updateVadMeter(rms, isSpeaking) {
  const fill = document.getElementById('vad-fill');
  const panel = document.querySelector('.voice-panel');
  const level = Math.min(Math.round((rms / 0.08) * 100), 100);

  if (fill) fill.style.width = `${level}%`;
  panel?.classList.toggle('is-speaking', isSpeaking);
}

function vadErrorMessage(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Microphone permission was blocked. Allow microphone access to use VAD.';
  }
  if (err?.name === 'NotFoundError') {
    return 'No microphone was found for VAD.';
  }
  if (err?.name === 'NotReadableError') {
    return 'The microphone is already in use by another app.';
  }
  return 'Could not start voice activity detection. Check microphone permissions.';
}

function appendTranscript(text) {
  const textarea = document.getElementById('answer-input');
  if (!textarea) return;

  const current = textarea.value.trim();
  const transcript = text.trim();
  textarea.value = current ? `${current} ${transcript}` : transcript;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateAnswerIntegrity() {
  const textarea = document.getElementById('answer-input');
  const submitBtn = document.getElementById('btn-submit-answer');
  const counter = document.getElementById('char-count');
  const answer = textarea?.value.trim() || '';
  const len = answer.length;

  if (counter) counter.textContent = `${len} character${len !== 1 ? 's' : ''}`;
  if (submitBtn) submitBtn.disabled = len < 10;

  if (isListening) return;
  if (!answer) {
    setVoiceState('idle', 'Speak your answer and review the transcript before submitting.');
    return;
  }

  const words = answer.split(/\s+/).filter(Boolean);
  if (words.length < 8) {
    setVoiceState('warning', 'Transcript captured. Add a little more detail before evaluation.');
    return;
  }

  if (lastSpeechConfidence !== null && lastSpeechConfidence < 0.65) {
    setVoiceState('warning', 'Transcript confidence was low. Review the text before submitting.');
    return;
  }

  setVoiceState('ready', 'Transcript ready. Submit Answer to let AI evaluate integrity and quality.');
}

function setVoiceState(state, message) {
  const panel = document.querySelector('.voice-panel');
  const status = document.getElementById('voice-status');

  panel?.classList.toggle('is-listening', state === 'listening' || isListening);
  panel?.classList.toggle('is-error', state === 'error');

  if (status) status.textContent = message;
  setVoiceButton(state === 'listening' || isListening);
}

function setVoiceButton(listening) {
  const voiceBtn = document.getElementById('btn-toggle-voice');
  if (!voiceBtn) return;

  voiceBtn.textContent = listening ? 'Stop Voice' : 'Start Voice';
  voiceBtn.classList.toggle('active', listening);
}

function setVoiceInterim(text) {
  const interim = document.getElementById('voice-interim');
  if (interim) interim.textContent = text.trim();
}

function clearVoiceInterim() {
  setVoiceInterim('');
}

function voiceErrorMessage(error) {
  if (error === 'not-allowed') {
    return 'Microphone permission was blocked. Allow microphone access to use voice answers.';
  }
  if (error === 'no-speech') {
    return 'No speech was detected. Try again and speak clearly.';
  }
  if (error === 'audio-capture') {
    return 'No microphone was found or it is already in use.';
  }
  return 'Voice capture stopped unexpectedly. You can try again or type your answer.';
}

function startQuestionTimer() {
  stopQuestionTimer();
  questionSecondsRemaining = QUESTION_SECONDS;
  renderQuestionTimer();

  questionTimerId = window.setInterval(() => {
    questionSecondsRemaining = Math.max(0, questionSecondsRemaining - 1);
    renderQuestionTimer();

    if (questionSecondsRemaining === 0) {
      stopQuestionTimer();
      stopVoiceCapture();
      setVoiceState('warning', 'Time is up. Submit your answer or add a final sentence.');
    }
  }, 1000);
}

function stopQuestionTimer() {
  if (questionTimerId) {
    window.clearInterval(questionTimerId);
    questionTimerId = null;
  }
}

function renderQuestionTimer() {
  const timer = document.getElementById('question-timer');
  if (!timer) return;

  const minutes = Math.floor(questionSecondsRemaining / 60);
  const seconds = questionSecondsRemaining % 60;
  timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timer.classList.toggle('is-warning', questionSecondsRemaining > 0 && questionSecondsRemaining <= 30);
  timer.classList.toggle('is-expired', questionSecondsRemaining === 0);
}

function speakCurrentQuestion() {
  const question = getCurrentQuestion();
  if (!question || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;

  stopQuestionReading();
  const utterance = new SpeechSynthesisUtterance(question.text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function stopQuestionReading() {
  if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
    window.speechSynthesis.cancel();
  }
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#4f46e5';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function renderList(listEl, items) {
  listEl.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    listEl.appendChild(li);
  });
}
