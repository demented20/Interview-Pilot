/**
 * Main interview orchestrator
 */
import { generateQuestions, evaluateAnswer } from './api.js';
import {
  state,
  setConfig,
  setQuestions,
  addAnswer,
  nextQuestion,
  getCurrentQuestion,
  resetState,
  isLastQuestion
} from './state.js';
import { saveSession, generateId } from './storage.js';
import { average } from '../utils.js';

/**
 * Start a new interview
 */
export async function startInterview(config) {
  resetState();
  setConfig(config);

  const questions = await generateQuestions(
    config.position,
    config.difficulty,
    config.type,
    config.totalQuestions || 10,
    config
  );

  setQuestions(questions);
  state.sessionId = generateId();
  state.isComplete = false;

  return {
    questions,
    sessionId: state.sessionId
  };
}

/**
 * Submit an answer for the current question
 */
export async function submitAnswer(answerText) {
  const question = getCurrentQuestion();
  if (!question) {
    throw new Error('No current question');
  }

  const scoreData = await evaluateAnswer(question, answerText, state.config);

  addAnswer({
    answerText,
    score: scoreData,
    questionText: question.text,
    category: question.category
  });

  return scoreData;
}

/**
 * Advance to next question or mark complete
 */
export function advance() {
  const hasNext = nextQuestion();
  if (!hasNext) {
    state.isComplete = true;
    // Persist session
    const summary = getSessionSummary();
    saveSession({
      id: state.sessionId,
      config: sanitizeConfig(state.config),
      answers: state.answers,
      summary,
      completedAt: new Date().toISOString()
    });
  }
  return !hasNext; // true if interview is complete
}

/**
 * Calculate final report
 */
export function calculateReport() {
  return getSessionSummary();
}

/**
 * Build session summary with averages and improvement plan
 */
export function getSessionSummary() {
  const answers = state.answers;
  if (!answers.length) {
    return {
      totalScore: 0,
      categoryAverages: {},
      strengths: [],
      weaknesses: [],
      improvementPlan: ['Complete at least one question to generate a report.']
    };
  }

  const overallScores = answers.map(a => a.score.overall);
  const totalScore = Math.round(average(overallScores));

  const categories = [
    'technicalAccuracy',
    'communication',
    'clarity',
    'confidence',
    'problemSolving'
  ];

  const categoryAverages = {};
  categories.forEach(cat => {
    const vals = answers.map(a => a.score.categoryScores[cat] || 0);
    categoryAverages[cat] = Math.round(average(vals));
  });

  // Aggregate strengths & weaknesses
  const strengthCount = {};
  const improvementCount = {};

  answers.forEach(a => {
    (a.score.strengths || []).forEach(s => {
      strengthCount[s] = (strengthCount[s] || 0) + 1;
    });
    (a.score.improvements || []).forEach(i => {
      improvementCount[i] = (improvementCount[i] || 0) + 1;
    });
  });

  const strengths = Object.entries(strengthCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  const weaknesses = Object.entries(improvementCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  // Generate improvement plan
  const improvementPlan = buildImprovementPlan(categoryAverages, weaknesses, state.config);

  return {
    totalScore,
    categoryAverages,
    strengths,
    weaknesses,
    improvementPlan,
    questionCount: answers.length,
    config: sanitizeConfig(state.config)
  };
}

function sanitizeConfig(config = {}) {
  const { apiKey, ...safeConfig } = config;
  return safeConfig;
}

function buildImprovementPlan(categoryAverages, weaknesses, config) {
  const plan = [];

  const sortedCats = Object.entries(categoryAverages).sort((a, b) => a[1] - b[1]);
  const weakest = sortedCats[0];

  if (weakest && weakest[1] < 70) {
    const label = formatCategory(weakest[0]);
    plan.push(`Focus on improving ${label} (current avg: ${weakest[1]}). Practice articulating technical concepts more clearly.`);
  }

  if (weaknesses.length) {
    plan.push(`Common feedback: "${weaknesses[0]}" – make this a deliberate practice point.`);
  }

  if (config?.type === 'behavioral' || config?.type === 'mixed') {
    plan.push('Use the STAR method (Situation, Task, Action, Result) consistently for behavioral questions.');
  }

  if (config?.type === 'technical' || config?.type === 'mixed') {
    plan.push('When answering technical questions, state assumptions, discuss trade-offs, and mention complexity where relevant.');
  }

  plan.push('Record yourself answering 2–3 questions and review for clarity and filler words.');
  plan.push('Review the ideal answer concepts after each practice session and refine your stories.');

  return plan.slice(0, 5);
}

function formatCategory(key) {
  const map = {
    technicalAccuracy: 'Technical Accuracy',
    communication: 'Communication',
    clarity: 'Clarity',
    confidence: 'Confidence',
    problemSolving: 'Problem Solving'
  };
  return map[key] || key;
}
