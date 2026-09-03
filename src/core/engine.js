import { COMBO_TIERS, LEVELS } from './config.js';
import { createSeededRandom, randomSeed } from './random.js';

export const opposite = (direction) => direction === 'left' ? 'right' : 'left';
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function comboInfo(combo) {
  const tier = COMBO_TIERS.find((candidate) => combo >= candidate.min);
  if (combo === 0) return { ...tier, name: '等待节奏' };
  return { ...tier };
}

export function milestoneFor(combo) {
  if (combo === 3) return '3 连击 · 节奏锁定 ×2';
  if (combo === 6) return '6 连击 · 神经超频 ×3';
  if (combo === 10) return '10 连击 · 心流爆发 ×4';
  if (combo > 10 && combo % 5 === 0) return `${combo} 连击 · 保持心流`;
  return '';
}

export function ruleForTurn(level, turn) {
  return level.rules[Math.floor(turn / level.switchEvery) % level.rules.length];
}

export function makePrompt(level, random = Math.random) {
  const word = random() > 0.5 ? 'left' : 'right';
  const isConflict = random() < level.conflict;
  return { word, arrow: isConflict ? opposite(word) : word, isConflict };
}

export function correctDirection(state) {
  return state.rule === 'word' ? state.prompt.word : state.prompt.arrow;
}

export function createSession(levelIndex, options = {}) {
  const level = options.level ?? LEVELS[levelIndex];
  if (!level) throw new RangeError(`Unknown level: ${levelIndex}`);
  const seed = options.seed ?? randomSeed();
  const random = createSeededRandom(seed);
  const now = options.now ?? Date.now();
  return {
    mode: options.mode ?? 'level',
    seed,
    random,
    playing: true,
    paused: false,
    levelIndex,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: options.lives ?? 3,
    maxLives: options.lives ?? 3,
    energy: 0,
    rule: ruleForTurn(level, 0),
    prompt: makePrompt(level, random),
    turn: 0,
    answered: 0,
    correctCount: 0,
    totalReactionMs: 0,
    deadline: now + level.deadline,
    questionStartedAt: now,
    overUntil: 0,
    justSwitched: false,
    passed: false,
  };
}

export function advanceQuestion(state, level, now = Date.now()) {
  const turn = state.turn + 1;
  const previousRule = state.rule;
  const rule = ruleForTurn(level, turn);
  return {
    ...state,
    turn,
    rule,
    prompt: makePrompt(level, state.random),
    justSwitched: previousRule !== rule,
    deadline: now + level.deadline,
    questionStartedAt: now,
  };
}

export function resolveAnswer(state, level, choice, now = Date.now()) {
  const expected = correctDirection(state);
  const correct = choice === expected;
  const reactionMs = clamp(now - state.questionStartedAt, 0, level.deadline);
  const wasOver = now < state.overUntil;
  const answered = state.answered + 1;

  if (!correct) {
    return {
      state: {
        ...state,
        answered,
        combo: 0,
        overUntil: 0,
        energy: Math.max(0, state.energy - 25),
        lives: state.lives - 1,
        totalReactionMs: state.totalReactionMs + reactionMs,
      },
      event: {
        type: choice === null ? 'timeout' : 'incorrect',
        expected,
        brokenCombo: state.combo,
        reactionMs,
      },
    };
  }

  const nextCombo = state.combo + 1;
  const combo = comboInfo(nextCombo);
  const base = 100 + Math.round(Math.max(0, (state.deadline - now) / level.deadline) * 75);
  const multiplier = combo.multiplier * (wasOver ? 2 : 1);
  const points = base * multiplier;
  let energy = Math.min(100, state.energy + 12 + combo.level * 2);
  let overUntil = state.overUntil;
  const flowStarted = energy >= 100 || nextCombo === 10;
  if (flowStarted) {
    energy = 0;
    overUntil = Math.max(overUntil, now + (nextCombo === 10 ? 5200 : 4200));
  }

  return {
    state: {
      ...state,
      answered,
      correctCount: state.correctCount + 1,
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
      score: state.score + points,
      energy,
      overUntil,
      totalReactionMs: state.totalReactionMs + reactionMs,
    },
    event: {
      type: 'correct', expected, points, multiplier, reactionMs,
      milestone: milestoneFor(nextCombo), flowStarted,
    },
  };
}

export function sessionSummary(state, level) {
  const accuracy = state.answered ? Math.round((state.correctCount / state.answered) * 100) : 0;
  return {
    levelId: level.id,
    levelIndex: state.levelIndex,
    mode: state.mode,
    score: state.score,
    accuracy,
    maxCombo: state.maxCombo,
    averageReactionMs: state.answered ? Math.round(state.totalReactionMs / state.answered) : 0,
    answered: state.answered,
    passed: state.answered >= level.questions && accuracy >= Math.round(level.target * 100),
    seed: state.seed,
  };
}
