/**
 * LocalStorage CRUD for interview sessions
 */
import { generateUUID } from '../utils.js';

const STORAGE_KEY = 'interviewpilot_sessions';

export function generateId() {
  return generateUUID();
}

export function saveSession(data) {
  try {
    const sessions = loadSessions();
    const session = {
      id: data.id || generateId(),
      createdAt: data.createdAt || new Date().toISOString(),
      ...data
    };
    // Update if exists, otherwise push
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    // Keep last 50 sessions
    if (sessions.length > 50) sessions.length = 50;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return session;
  } catch (e) {
    console.error('Failed to save session', e);
    return null;
  }
}

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load sessions', e);
    return [];
  }
}

export function clearSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear sessions', e);
    return false;
  }
}

export function getSessionById(id) {
  return loadSessions().find(s => s.id === id) || null;
}
