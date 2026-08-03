/**
 * Simulated LLM client – rule-based question generation & answer evaluation
 * No real API calls. Fully offline.
 */

import { generateUUID } from '../utils.js';

// ============== QUESTION BANK (25+ questions) ==============
const QUESTION_BANK = [
  // ===== SOFTWARE ENGINEER =====
  {
    id: 'se-1',
    position: 'Software Engineer',
    type: 'technical',
    difficulty: 'easy',
    category: 'Technical',
    text: 'Explain the difference between an array and a linked list. When would you use one over the other?',
    keywords: ['array', 'linked list', 'contiguous', 'pointer', 'random access', 'insertion', 'deletion', 'memory', 'O(1)', 'O(n)'],
    idealAnswer: 'Arrays store elements in contiguous memory allowing O(1) random access but costly insertions/deletions. Linked lists use nodes with pointers, better for frequent insertions/deletions but slower access.'
  },
  {
    id: 'se-2',
    position: 'Software Engineer',
    type: 'technical',
    difficulty: 'medium',
    category: 'Technical',
    text: 'What is the time complexity of binary search and how does it work?',
    keywords: ['binary search', 'log n', 'sorted', 'divide', 'conquer', 'midpoint', 'O(log n)'],
    idealAnswer: 'Binary search works on sorted arrays by repeatedly dividing the search interval in half. Time complexity is O(log n).'
  },
  {
    id: 'se-3',
    position: 'Software Engineer',
    type: 'technical',
    difficulty: 'hard',
    category: 'Technical',
    text: 'Explain how a hash table works and how you would handle collisions.',
    keywords: ['hash', 'bucket', 'collision', 'chaining', 'open addressing', 'load factor', 'rehash'],
    idealAnswer: 'A hash table maps keys to values via a hash function. Collisions are handled by chaining (linked lists) or open addressing (probing). Load factor determines when to resize.'
  },
  {
    id: 'se-4',
    position: 'Software Engineer',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'Tell me about a time you had a conflict with a teammate. How did you resolve it?',
    keywords: ['conflict', 'communicate', 'listen', 'compromise', 'team', 'resolve', 'feedback'],
    idealAnswer: 'I listened actively, understood their perspective, focused on the shared goal, and we reached a compromise that improved the outcome.'
  },
  {
    id: 'se-5',
    position: 'Software Engineer',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Behavioral',
    text: 'Describe a challenging bug you fixed. What was your process?',
    keywords: ['debug', 'reproduce', 'logs', 'root cause', 'test', 'fix', 'hypothesis'],
    idealAnswer: 'I reproduced the issue, checked logs, formed hypotheses, used binary search on commits or isolation techniques, fixed the root cause, and added tests.'
  },
  {
    id: 'se-6',
    position: 'Software Engineer',
    type: 'technical',
    difficulty: 'medium',
    category: 'System Design',
    text: 'How would you design a URL shortener like bit.ly?',
    keywords: ['hash', 'base62', 'database', 'redirect', 'unique', 'scale', 'cache', 'id'],
    idealAnswer: 'Generate unique short codes (base62 of an auto-increment ID or hash), store mapping in a DB, handle redirects, use caching and sharding for scale.'
  },

  // ===== PRODUCT MANAGER =====
  {
    id: 'pm-1',
    position: 'Product Manager',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'How do you prioritize features when everything seems important?',
    keywords: ['prioritize', 'impact', 'effort', 'rice', 'moscow', 'user value', 'roadmap', 'stakeholder'],
    idealAnswer: 'I use frameworks like RICE or MoSCoW, weigh user impact vs effort, align with company goals, and communicate trade-offs clearly to stakeholders.'
  },
  {
    id: 'pm-2',
    position: 'Product Manager',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Product Sense',
    text: 'Tell me about a product you love. What would you improve?',
    keywords: ['user', 'pain point', 'metric', 'feature', 'feedback', 'experiment'],
    idealAnswer: 'I pick a product, identify a real user pain point, propose a measurable improvement, and describe how I would validate it with data or experiments.'
  },
  {
    id: 'pm-3',
    position: 'Product Manager',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'Leadership',
    text: 'Describe a time you had to say no to a stakeholder. How did you handle it?',
    keywords: ['stakeholder', 'data', 'trade-off', 'roadmap', 'align', 'communicate', 'alternative'],
    idealAnswer: 'I presented data-backed reasoning, offered alternatives that still moved toward the goal, and kept the relationship positive by being transparent.'
  },
  {
    id: 'pm-4',
    position: 'Product Manager',
    type: 'technical',
    difficulty: 'medium',
    category: 'Technical',
    text: 'How would you measure the success of a new feature after launch?',
    keywords: ['metric', 'kpi', 'adoption', 'retention', 'engagement', 'a/b', 'north star'],
    idealAnswer: 'Define primary and secondary metrics before launch, set success criteria, instrument analytics, run A/B tests if possible, and review qualitatively with users.'
  },

  // ===== DATA SCIENTIST =====
  {
    id: 'ds-1',
    position: 'Data Scientist',
    type: 'technical',
    difficulty: 'easy',
    category: 'Technical',
    text: 'What is the difference between supervised and unsupervised learning?',
    keywords: ['supervised', 'unsupervised', 'label', 'classification', 'regression', 'clustering', 'training'],
    idealAnswer: 'Supervised learning uses labeled data to predict outcomes (classification/regression). Unsupervised finds patterns without labels (clustering, dimensionality reduction).'
  },
  {
    id: 'ds-2',
    position: 'Data Scientist',
    type: 'technical',
    difficulty: 'medium',
    category: 'Technical',
    text: 'Explain overfitting and how you prevent it.',
    keywords: ['overfit', 'regularization', 'cross-validation', 'train', 'test', 'dropout', 'early stopping'],
    idealAnswer: 'Overfitting occurs when a model memorizes training data and fails to generalize. Prevention: more data, regularization, cross-validation, simpler models, early stopping.'
  },
  {
    id: 'ds-3',
    position: 'Data Scientist',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Behavioral',
    text: 'Tell me about a data project where the results surprised you or stakeholders.',
    keywords: ['insight', 'hypothesis', 'data', 'communicate', 'stakeholder', 'impact'],
    idealAnswer: 'I describe the context, the unexpected finding, how I validated it, and how I communicated the insight so stakeholders could act on it.'
  },
  {
    id: 'ds-4',
    position: 'Data Scientist',
    type: 'technical',
    difficulty: 'hard',
    category: 'Technical',
    text: 'How would you handle a highly imbalanced classification dataset?',
    keywords: ['imbalance', 'oversample', 'undersample', 'smote', 'class weight', 'precision', 'recall', 'f1', 'auc'],
    idealAnswer: 'Use resampling (SMOTE, undersampling), class weights, choose appropriate metrics (precision/recall/F1/AUC instead of accuracy), and possibly anomaly-detection approaches.'
  },

  // ===== UX DESIGNER =====
  {
    id: 'ux-1',
    position: 'UX Designer',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'Walk me through your design process for a new feature.',
    keywords: ['research', 'user', 'persona', 'wireframe', 'prototype', 'test', 'iterate', 'feedback'],
    idealAnswer: 'I start with user research and problem definition, create personas/journeys, ideate, wireframe, prototype, test with users, and iterate based on feedback.'
  },
  {
    id: 'ux-2',
    position: 'UX Designer',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Design',
    text: 'Tell me about a time you had to redesign something based on user feedback.',
    keywords: ['feedback', 'usability', 'test', 'iterate', 'insight', 'improve'],
    idealAnswer: 'I collected usability test data, identified the core friction points, redesigned the flow, validated the new version, and measured the improvement.'
  },
  {
    id: 'ux-3',
    position: 'UX Designer',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'Collaboration',
    text: 'How do you handle disagreements with engineers or PMs about a design decision?',
    keywords: ['collaborate', 'data', 'user', 'trade-off', 'prototype', 'align'],
    idealAnswer: 'I bring user data or prototypes to the discussion, understand technical constraints, explore alternatives together, and focus on shared user outcomes.'
  },

  // ===== MARKETING MANAGER =====
  {
    id: 'mm-1',
    position: 'Marketing Manager',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'How do you measure the success of a marketing campaign?',
    keywords: ['kpi', 'roi', 'conversion', 'cac', 'engagement', 'attribution', 'goal'],
    idealAnswer: 'I define clear goals and KPIs upfront (CAC, conversion rate, ROI, engagement), track them with proper attribution, and optimize based on results.'
  },
  {
    id: 'mm-2',
    position: 'Marketing Manager',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Strategy',
    text: 'Describe a campaign that underperformed. What did you learn?',
    keywords: ['learn', 'hypothesis', 'data', 'audience', 'message', 'iterate', 'fail'],
    idealAnswer: 'I analyzed the data to find the weak point (audience, creative, channel), extracted lessons, and applied them to future campaigns.'
  },
  {
    id: 'mm-3',
    position: 'Marketing Manager',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'Leadership',
    text: 'How would you launch a product in a new market with limited budget?',
    keywords: ['budget', 'channel', 'organic', 'content', 'community', 'partnership', 'test'],
    idealAnswer: 'Focus on high-ROI organic channels, community building, content, partnerships, run small tests to find what works, then scale the winners.'
  },

  // ===== GENERAL / MIXED =====
  {
    id: 'gen-1',
    position: 'General',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'Why do you want to work at our company?',
    keywords: ['mission', 'product', 'value', 'culture', 'impact', 'growth'],
    idealAnswer: 'I connect the company mission/product to my skills and values, show research, and explain the specific impact I want to make.'
  },
  {
    id: 'gen-2',
    position: 'General',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Behavioral',
    text: 'Tell me about a time you failed. What did you learn?',
    keywords: ['fail', 'learn', 'own', 'reflect', 'improve', 'growth'],
    idealAnswer: 'I take ownership, describe the situation honestly, focus on the lesson and how I applied it afterward.'
  },
  {
    id: 'gen-3',
    position: 'General',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Leadership',
    text: 'Describe a time you had to lead without formal authority.',
    keywords: ['influence', 'persuade', 'collaborate', 'vision', 'trust', 'result'],
    idealAnswer: 'I built credibility through expertise and relationships, aligned people around a shared goal, and delivered results through influence rather than hierarchy.'
  },
  {
    id: 'gen-4',
    position: 'General',
    type: 'behavioral',
    difficulty: 'hard',
    category: 'Problem Solving',
    text: 'Tell me about the most complex problem you have solved.',
    keywords: ['complex', 'break down', 'analyze', 'solution', 'impact', 'trade-off'],
    idealAnswer: 'I break the problem into parts, show structured thinking, discuss trade-offs, and quantify the outcome or impact.'
  },
  {
    id: 'gen-5',
    position: 'General',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Behavioral',
    text: 'Where do you see yourself in 5 years?',
    keywords: ['growth', 'skill', 'impact', 'career', 'learn', 'contribute'],
    idealAnswer: 'I describe realistic growth that aligns with the role and company, emphasizing continuous learning and increasing impact.'
  }
];

const POSITIONS = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'Marketing Manager',
  'General'
];

/**
 * Generate a set of questions based on config
 */
function generateLocalQuestions(position, difficulty, type, count = 10) {
  let pool = QUESTION_BANK.filter(q => {
    const posMatch = q.position === position || q.position === 'General';
    const diffMatch = difficulty === 'mixed' || q.difficulty === difficulty;
    const typeMatch = type === 'mixed' || q.type === type;
    return posMatch && diffMatch && typeMatch;
  });

  // Fallback if pool is too small
  if (pool.length < count) {
    pool = QUESTION_BANK.filter(q => q.position === position || q.position === 'General');
  }
  if (pool.length < count) {
    pool = [...QUESTION_BANK];
  }

  // Shuffle and take `count`
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // Ensure unique ids and add runtime id if needed
  return selected.map((q, i) => ({
    ...q,
    id: q.id || generateUUID(),
    order: i + 1
  }));
}

/**
 * Evaluate an answer using keyword matching + length heuristics
 * Returns a structured score object
 */
function evaluateAnswerLocally(question, answerText) {
  const answer = (answerText || '').toLowerCase().trim();
  const words = answer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Keyword matching
  const keywords = question.keywords || [];
  let matched = 0;
  const matchedKeywords = [];
  keywords.forEach(kw => {
    if (answer.includes(kw.toLowerCase())) {
      matched++;
      matchedKeywords.push(kw);
    }
  });
  const keywordRatio = keywords.length ? matched / keywords.length : 0.5;

  // Length score (ideal 80–250 words for most answers)
  let lengthScore = 0.4;
  if (wordCount >= 40 && wordCount <= 300) lengthScore = 0.85;
  else if (wordCount >= 20 && wordCount < 40) lengthScore = 0.65;
  else if (wordCount > 300) lengthScore = 0.7;
  else if (wordCount < 15) lengthScore = 0.25;

  // Structure hints (STAR-ish)
  const hasStructure =
    /\b(situation|task|action|result|first|then|because|therefore|for example)\b/i.test(answer);
  const structureBonus = hasStructure ? 0.1 : 0;

  // Category scores (0–100)
  const technicalAccuracy = Math.round(clamp(keywordRatio * 100 + (wordCount > 30 ? 10 : 0), 15, 98));
  const communication = Math.round(clamp(lengthScore * 100 + (hasStructure ? 15 : 0), 20, 95));
  const clarity = Math.round(clamp((keywordRatio * 0.6 + lengthScore * 0.4) * 100, 20, 95));
  const confidence = Math.round(clamp(
    (wordCount > 50 ? 75 : 50) + (matched > 2 ? 15 : 0) + (hasStructure ? 10 : 0),
    25,
    92
  ));
  const problemSolving = Math.round(clamp(
    keywordRatio * 80 + (hasStructure ? 15 : 0) + (wordCount > 60 ? 10 : 0),
    20,
    96
  ));

  const overall = Math.round(
    (technicalAccuracy + communication + clarity + confidence + problemSolving) / 5
  );

  // Strengths & improvements
  const strengths = [];
  const improvements = [];

  if (keywordRatio >= 0.5) strengths.push('Covered key concepts relevant to the question');
  if (wordCount >= 60) strengths.push('Provided a sufficiently detailed answer');
  if (hasStructure) strengths.push('Answer showed clear structure and logical flow');
  if (matched >= 3) strengths.push(`Used important terms: ${matchedKeywords.slice(0, 3).join(', ')}`);

  if (keywordRatio < 0.35) improvements.push('Include more domain-specific keywords and concepts');
  if (wordCount < 40) improvements.push('Expand your answer with concrete examples or more depth');
  if (!hasStructure) improvements.push('Structure your response (e.g. Situation → Action → Result)');
  if (wordCount > 350) improvements.push('Be more concise while keeping the key points');
  if (overall < 60) improvements.push('Review the ideal answer concepts and practice articulating them clearly');

  if (strengths.length === 0) strengths.push('You attempted the question – keep practicing!');
  if (improvements.length === 0) improvements.push('Continue refining with more real-world examples');

  return {
    overall,
    categoryScores: {
      technicalAccuracy,
      communication,
      clarity,
      confidence,
      problemSolving
    },
    strengths,
    improvements,
    matchedKeywords,
    wordCount
  };
}

/**
 * Generate a set of AI-authored questions based on config.
 */
export async function generateQuestions(position, difficulty, type, count = 10, config = {}) {
  const prompt = `
You are an expert interviewer. Generate ${count} original mock interview questions.

Target position: ${position}
Difficulty: ${difficulty}
Interview type: ${type}

Return only valid JSON in this exact shape:
{
  "questions": [
    {
      "category": "Behavioral | Technical | System Design | Product Sense | Leadership | Design | Strategy | Problem Solving",
      "type": "behavioral | technical",
      "difficulty": "easy | medium | hard",
      "text": "Question text",
      "idealAnswer": "A concise rubric-level ideal answer",
      "keywords": ["important", "concepts"]
    }
  ]
}

Rules:
- Create exactly ${count} questions.
- Every array item must be separated with a comma.
- Do not reuse common textbook phrasing when a role-specific scenario is better.
- For mixed interviews, include both behavioral and technical questions when appropriate.
- Keep each question under 45 words.
- Keep idealAnswer under 35 words.
`;

  const data = await callAIJson(prompt, { repairLabel: 'question generation' });
  const questions = Array.isArray(data.questions) ? data.questions : [];

  if (questions.length === 0) {
    throw new Error('The AI response did not include any interview questions.');
  }

  return questions.slice(0, count).map((q, i) => ({
    id: generateUUID(),
    position,
    type: normalizeType(q.type, type),
    difficulty: normalizeDifficulty(q.difficulty, difficulty),
    category: typeof q.category === 'string' && q.category.trim() ? q.category.trim() : 'Interview',
    text: typeof q.text === 'string' && q.text.trim() ? q.text.trim() : `Question ${i + 1}`,
    keywords: normalizeStringArray(q.keywords),
    idealAnswer: typeof q.idealAnswer === 'string' ? q.idealAnswer.trim() : '',
    order: i + 1
  }));
}

/**
 * Evaluate an answer with AI and return the score object the UI expects.
 */
export async function evaluateAnswer(question, answerText, config = {}) {
  const answer = (answerText || '').trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const prompt = `
You are a rigorous but helpful interview coach. Evaluate the candidate answer.

Question:
${question.text}

Question category: ${question.category || question.type || 'Interview'}
Target position: ${config.position || question.position || 'N/A'}
Difficulty: ${config.difficulty || question.difficulty || 'N/A'}
Ideal answer/rubric:
${question.idealAnswer || 'Use your expertise to judge the answer.'}

Candidate answer:
${answer}

Return only valid JSON in this exact shape:
{
  "overall": 0,
  "categoryScores": {
    "technicalAccuracy": 0,
    "communication": 0,
    "clarity": 0,
    "confidence": 0,
    "problemSolving": 0
  },
  "strengths": ["specific strength"],
  "improvements": ["specific improvement"],
  "matchedKeywords": ["concept noticed"]
}

Scoring rules:
- Scores must be integers from 0 to 100.
- Use the same five category keys exactly.
- Check answer integrity: whether the answer directly addresses the question, is internally consistent, sounds authentic, and avoids vague or evasive claims.
- Strengths and improvements should be short, concrete, and actionable.
- Mention missing technical trade-offs, examples, STAR structure, metrics, or clarity when relevant.
`;

  const data = await callAIJson(prompt, { repairLabel: 'answer evaluation' });
  const categoryScores = normalizeCategoryScores(data.categoryScores);

  return {
    overall: normalizeScore(data.overall, averageScores(Object.values(categoryScores))),
    categoryScores,
    strengths: normalizeStringArray(data.strengths, ['Good effort engaging with the question']),
    improvements: normalizeStringArray(data.improvements, ['Add more concrete examples and clearer structure']),
    matchedKeywords: normalizeStringArray(data.matchedKeywords),
    wordCount
  };
}

async function callAIJson(prompt, options = {}) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only API. Return a single valid JSON object and no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1200,
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const message = await readAIError(response);
    throw new Error(message || `AI request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  try {
    return parseJsonFromText(text);
  } catch (err) {
    console.warn(`Repairing invalid AI JSON from ${options.repairLabel || 'AI response'}:`, err);
    return repairJsonResponse(text, err);
  }
}

async function repairJsonResponse(text, parseError) {
  if (!text) throw parseError;

  const repairPrompt = `
Fix this malformed JSON and return only one valid JSON object. Do not explain anything.

Malformed JSON:
${text}
`;

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You repair malformed JSON. Return only valid JSON.'
        },
        {
          role: 'user',
          content: repairPrompt
        }
      ],
      max_tokens: 1400,
      temperature: 0
    })
  });

  if (!response.ok) {
    const message = await readAIError(response);
    throw new Error(message || 'The AI returned invalid JSON and repair failed.');
  }

  const payload = await response.json();
  const repairedText = extractResponseText(payload);
  return parseJsonFromText(repairedText);
}

async function readAIError(response) {
  try {
    const payload = await response.json();
    return payload.error?.message;
  } catch {
    return null;
  }
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (Array.isArray(payload.choices)) {
    for (const choice of payload.choices) {
      const content = choice?.message?.content;
      if (typeof content === 'string' && content.trim()) return content;
      if (Array.isArray(content)) {
        const text = content
          .map(part => part?.text || part?.content || '')
          .join('\n')
          .trim();
        if (text) return text;
      }
      if (typeof choice?.text === 'string' && choice.text.trim()) return choice.text;
    }
  }

  const chunks = [];
  (payload.output || []).forEach(item => {
    (item.content || []).forEach(content => {
      if (typeof content.text === 'string') chunks.push(content.text);
      if (typeof content.output_text === 'string') chunks.push(content.output_text);
    });
  });

  const text = chunks.join('\n').trim();
  if (text) return text;

  console.warn('AI response did not contain text content:', payload);
  return '';
}

function parseJsonFromText(text) {
  if (!text) {
    throw new Error('The AI returned an empty response.');
  }

  let lastError = null;

  try {
    return JSON.parse(cleanJsonText(text));
  } catch (err) {
    lastError = err;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('The AI response was not valid JSON.');
    }
    try {
      return JSON.parse(cleanJsonText(match[0]));
    } catch (innerErr) {
      lastError = innerErr;
    }
  }

  throw new Error(`The AI returned malformed JSON and automatic cleanup failed: ${lastError?.message || 'unknown parse error'}`);
}

function cleanJsonText(text) {
  let cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/}\s*(?={)/g, '},')
    .replace(/]\s*(?="[^"]+"\s*:)/g, '],')
    .replace(/"\s*(?="[^"]+"\s*:)/g, '",')
    .replace(/"\s+(?=")/g, '", ');

  // Some fast models omit commas between array objects after indentation.
  cleaned = cleaned.replace(/}\s*\n\s*{/g, '},\n    {');
  return cleaned;
}

function normalizeType(value, fallback) {
  const typeValue = String(value || fallback || 'behavioral').toLowerCase();
  return typeValue === 'technical' ? 'technical' : 'behavioral';
}

function normalizeDifficulty(value, fallback) {
  const difficultyValue = String(value || fallback || 'medium').toLowerCase();
  return ['easy', 'medium', 'hard'].includes(difficultyValue) ? difficultyValue : 'medium';
}

function normalizeCategoryScores(scores = {}) {
  return {
    technicalAccuracy: normalizeScore(scores.technicalAccuracy, 50),
    communication: normalizeScore(scores.communication, 50),
    clarity: normalizeScore(scores.clarity, 50),
    confidence: normalizeScore(scores.confidence, 50),
    problemSolving: normalizeScore(scores.problemSolving, 50)
  };
}

function normalizeScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return Math.round(fallback);
  return Math.round(clamp(number, 0, 100));
}

function normalizeStringArray(value, fallback = []) {
  const arr = Array.isArray(value) ? value : fallback;
  return arr
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function averageScores(scores) {
  if (!scores.length) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

export function getAvailablePositions() {
  return POSITIONS.filter(p => p !== 'General');
}
