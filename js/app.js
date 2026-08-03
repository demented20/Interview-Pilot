/**
 * InterviewPilot AI – Main Entry Point
 */
import { showScreen, getCurrentScreen } from './ui/router.js';
import { initLanding } from './ui/landing.js';
import { initSetup, getSetupData, hasRequiredMediaPermissions, requestRequiredPermissions } from './ui/setup.js';
import { initInterview, renderQuestion, showFeedback, updateProgress, stopInterviewSessionTools } from './ui/interview.js';
import { initDashboard, renderReport } from './ui/dashboard.js';
import { startInterview, submitAnswer, advance, getSessionSummary } from './core/engine.js';
import { getCurrentQuestion, getProgress, resetState } from './core/state.js';
import { formatDate } from './utils.js';

let hiddenInterviewTimer = null;

function bootstrap() {
  // Initialize all UI modules
  initLanding();
  initSetup();
  initInterview();
  initDashboard();

  // Wire custom events
  document.addEventListener('interview:start', onStartInterview);
  document.addEventListener('interview:submit', onSubmitAnswer);
  document.addEventListener('interview:next', onNextQuestion);
  document.addEventListener('report:export', onExportReport);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', stopInterviewSessionTools);

  // Start on landing
  showScreen('landing');
  window.setTimeout(() => {
    requestRequiredPermissions();
  }, 600);
  console.log('InterviewPilot AI ready');
}

async function onStartInterview(e) {
  const config = e.detail || getSetupData();
  if (!config.position || !config.difficulty || !config.type) {
    showNotification('Setup incomplete', 'Please fill in the role, difficulty, and interview type before starting.', 'warning');
    return;
  }

  if (!hasRequiredMediaPermissions()) {
    const granted = await requestRequiredPermissions();
    if (!granted) {
      showNotification('Permissions required', 'Camera and microphone access are required before starting the interview.', 'warning');
      return;
    }
  }

  const startBtn = document.getElementById('btn-start-interview');
  const originalText = startBtn?.textContent;

  try {
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'Generating questions...';
    }

    await startInterview(config);
    const question = getCurrentQuestion();
    renderQuestion(question);
    showScreen('interview');
  } catch (err) {
    console.error(err);
    showNotification('Question generation failed', friendlyErrorMessage(err, 'Something went wrong while generating your interview questions.'), 'error');
  } finally {
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = originalText || 'Start Interview';
    }
  }
}

async function onSubmitAnswer(e) {
  const { answerText } = e.detail;
  const submitBtn = document.getElementById('btn-submit-answer');
  const originalText = submitBtn?.textContent;

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Evaluating...';
    }

    const scoreData = await submitAnswer(answerText);
    showFeedback(scoreData);
  } catch (err) {
    console.error(err);
    showNotification('Answer evaluation failed', friendlyErrorMessage(err, 'Something went wrong while evaluating your answer.'), 'error');
    if (submitBtn) submitBtn.disabled = false;
  } finally {
    if (submitBtn) submitBtn.textContent = originalText || 'Submit Answer';
  }
}

function onNextQuestion() {
  const isComplete = advance();
  if (isComplete) {
    stopInterviewSessionTools();
    const report = getSessionSummary();
    renderReport(report);
    showScreen('report');
  } else {
    const question = getCurrentQuestion();
    renderQuestion(question);
    const { current, total } = getProgress();
    updateProgress(current, total);
  }
}

function onVisibilityChange() {
  if (getCurrentScreen() !== 'interview') {
    if (hiddenInterviewTimer) {
      window.clearTimeout(hiddenInterviewTimer);
      hiddenInterviewTimer = null;
    }
    return;
  }

  if (document.hidden) {
    hiddenInterviewTimer = window.setTimeout(() => {
      terminateInterviewForVisibility();
    }, 5000);
    return;
  }

  if (hiddenInterviewTimer) {
    window.clearTimeout(hiddenInterviewTimer);
    hiddenInterviewTimer = null;
  }
}

function terminateInterviewForVisibility() {
  hiddenInterviewTimer = null;
  stopInterviewSessionTools();
  resetState();
  showScreen('setup');
  showNotification('Interview stopped', 'Window closed or minimized for more than 5 seconds. The interview was stopped to protect integrity.', 'warning');
}

function onExportReport() {
  const report = getSessionSummary();
  const text = buildExportText(report);
  downloadTextFile(text, `interviewpilot-report-${Date.now()}.txt`);
}

function buildExportText(report) {
  const lines = [
    '=== InterviewPilot AI – Session Report ===',
    `Date: ${formatDate(new Date())}`,
    `Position: ${report.config?.position || 'N/A'}`,
    `Difficulty: ${report.config?.difficulty || 'N/A'}`,
    `Type: ${report.config?.type || 'N/A'}`,
    `Questions answered: ${report.questionCount || 0}`,
    '',
    `Overall Score: ${report.totalScore}/100`,
    '',
    'Category Averages:',
    ...Object.entries(report.categoryAverages || {}).map(
      ([k, v]) => `  - ${k}: ${v}`
    ),
    '',
    'Top Strengths:',
    ...(report.strengths || []).map(s => `  • ${s}`),
    '',
    'Areas to Improve:',
    ...(report.weaknesses || []).map(w => `  • ${w}`),
    '',
    'Improvement Plan:',
    ...(report.improvementPlan || []).map((p, i) => `  ${i + 1}. ${p}`),
    '',
    'Generated by InterviewPilot AI (offline v1)'
  ];
  return lines.join('\n');
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function friendlyErrorMessage(err, fallback) {
  const message = err?.message || '';
  const lower = message.toLowerCase();

  if (lower.includes('empty response')) {
    return 'The AI returned an empty message. Please try again.';
  }
  if (lower.includes('malformed json') || lower.includes('valid json') || lower.includes('parse')) {
    return 'The AI returned a message we could not read. Please try again.';
  }
  if (lower.includes('missing openrouter api key')) {
    return 'The AI key is missing. Add your OpenRouter key in the backend config file.';
  }
  if (lower.includes('ai request failed')) {
    return 'The AI service could not complete the request. Please check the key, model, or connection.';
  }

  return message || fallback;
}

function showNotification(title, message, type = 'info', duration = 6500) {
  const container = document.getElementById('app-notifications');
  if (!container) return;

  const item = document.createElement('div');
  item.className = `notification ${type}`;

  const titleEl = document.createElement('div');
  titleEl.className = 'notification-title';
  titleEl.textContent = title;

  const messageEl = document.createElement('p');
  messageEl.className = 'notification-message';
  messageEl.textContent = message;

  item.append(titleEl, messageEl);
  container.appendChild(item);

  window.setTimeout(() => {
    item.remove();
  }, duration);
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
