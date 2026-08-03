/**
 * Setup form logic
 */
import { showScreen } from './router.js';

let selectedDifficulty = null;
let selectedType = null;
let mediaPermissionsGranted = false;

export function initSetup() {
  bindPositionInput();
  bindDifficultyButtons();
  bindTypeButtons();
  bindForm();
  bindBackButton();
  bindPermissionButton();
  checkExistingPermissions();
}

function bindPositionInput() {
  const input = document.getElementById('position-input');
  input?.addEventListener('input', updateStartButton);
}

function bindDifficultyButtons() {
  const group = document.getElementById('difficulty-group');
  if (!group) return;

  group.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.value;
      updateStartButton();
    });
  });
}

function bindTypeButtons() {
  const group = document.getElementById('type-group');
  if (!group) return;

  group.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.value;
      updateStartButton();
    });
  });
}

function bindForm() {
  const form = document.getElementById('setup-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateSetup()) return;

    // Dispatch custom event with data – app.js will handle starting the interview
    const data = getSetupData();
    document.dispatchEvent(new CustomEvent('interview:start', { detail: data }));
  });
}

function bindBackButton() {
  const btn = document.getElementById('btn-back-landing');
  if (btn) {
    btn.addEventListener('click', () => showScreen('landing'));
  }
}

function bindPermissionButton() {
  const btn = document.getElementById('btn-request-permissions');
  btn?.addEventListener('click', requestRequiredPermissions);
}

function updateStartButton() {
  const btn = document.getElementById('btn-start-interview');
  if (btn) {
    btn.disabled = !validateSetup();
  }
}

export function getSetupData() {
  const position = document.getElementById('position-input')?.value.trim() || '';

  return {
    position,
    difficulty: selectedDifficulty,
    type: selectedType,
    totalQuestions: 5
  };
}

export function validateSetup() {
  const position = document.getElementById('position-input')?.value.trim();
  return Boolean(position && selectedDifficulty && selectedType && mediaPermissionsGranted);
}

export function hasRequiredMediaPermissions() {
  return mediaPermissionsGranted;
}

export async function requestRequiredPermissions() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setPermissionState(false, 'Camera and microphone are not supported in this browser.');
    return false;
  }

  const btn = document.getElementById('btn-request-permissions');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Requesting...';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    });
    stream.getTracks().forEach(track => track.stop());
    setPermissionState(true, 'Camera and microphone access granted.');
    return true;
  } catch (err) {
    console.error(err);
    setPermissionState(false, permissionErrorMessage(err));
    return false;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = mediaPermissionsGranted ? 'Access Granted' : 'Allow Access';
    }
    updateStartButton();
  }
}

async function checkExistingPermissions() {
  if (!navigator.permissions?.query) {
    setPermissionState(false, 'Click Allow Access to enable camera and microphone.');
    return;
  }

  try {
    const [camera, microphone] = await Promise.all([
      navigator.permissions.query({ name: 'camera' }),
      navigator.permissions.query({ name: 'microphone' })
    ]);
    const granted = camera.state === 'granted' && microphone.state === 'granted';
    setPermissionState(
      granted,
      granted ? 'Camera and microphone access granted.' : 'Click Allow Access to enable camera and microphone.'
    );
    camera.onchange = checkExistingPermissions;
    microphone.onchange = checkExistingPermissions;
  } catch {
    setPermissionState(false, 'Click Allow Access to enable camera and microphone.');
  } finally {
    updateStartButton();
  }
}

function setPermissionState(granted, message) {
  mediaPermissionsGranted = granted;
  const panel = document.querySelector('.permissions-panel');
  const status = document.getElementById('permissions-status');
  const btn = document.getElementById('btn-request-permissions');

  panel?.classList.toggle('is-granted', granted);
  panel?.classList.toggle('is-denied', !granted);
  if (status) status.textContent = message;
  if (btn) btn.textContent = granted ? 'Access Granted' : 'Allow Access';
}

function permissionErrorMessage(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Permission blocked. Allow camera and microphone access in your browser settings.';
  }
  if (err?.name === 'NotFoundError') {
    return 'Camera or microphone not found. Connect both devices before starting.';
  }
  if (err?.name === 'NotReadableError') {
    return 'Camera or microphone is already in use by another app.';
  }
  return 'Could not verify camera and microphone access.';
}
