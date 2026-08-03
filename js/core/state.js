/**
 * Interview state machine
 */

export const state = {
  currentQuestionIndex: 0,
  answers: [],
  questions: [],
  config: {},
  isComplete: false,
  totalQuestions: 10,
  sessionId: null
};

export function getCurrentQuestion() {
  if (!state.questions.length) return null;
  return state.questions[state.currentQuestionIndex] || null;
}

export function getProgress() {
  const current = Math.min(state.currentQuestionIndex + 1, state.totalQuestions);
  return {
    current,
    total: state.totalQuestions,
    percent: Math.round((current / state.totalQuestions) * 100)
  };
}

export function addAnswer(answerData) {
  state.answers.push({
    questionIndex: state.currentQuestionIndex,
    questionId: state.questions[state.currentQuestionIndex]?.id,
    ...answerData,
    timestamp: new Date().toISOString()
  });
}

export function nextQuestion() {
  if (state.currentQuestionIndex < state.totalQuestions - 1) {
    state.currentQuestionIndex += 1;
    return true;
  }
  state.isComplete = true;
  return false;
}

export function resetState() {
  state.currentQuestionIndex = 0;
  state.answers = [];
  state.questions = [];
  state.config = {};
  state.isComplete = false;
  state.totalQuestions = 10;
  state.sessionId = null;
}

export function setConfig(config) {
  state.config = { ...config };
  if (config.totalQuestions) {
    state.totalQuestions = config.totalQuestions;
  }
}

export function setQuestions(questions) {
  state.questions = questions;
  state.totalQuestions = questions.length;
}

export function isLastQuestion() {
  return state.currentQuestionIndex >= state.totalQuestions - 1;
}
