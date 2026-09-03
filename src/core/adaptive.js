import { clamp } from './engine.js';

export function adaptiveMode(profile) {
  const { rating, recentFailures } = profile.adaptive;
  const played = profile.sessionHistory.length;
  if (recentFailures >= 2) {
    return {
      id: 'recovery', label: '恢复模式', deadlineMultiplier: 1.18,
      conflictDelta: -0.08, extraLives: 1,
    };
  }
  if (played >= 3 && rating <= 850) {
    return {
      id: 'steady', label: '稳定模式', deadlineMultiplier: 1.10,
      conflictDelta: -0.04, extraLives: 0,
    };
  }
  if (played >= 5 && rating >= 1300) {
    return {
      id: 'advanced', label: '进阶节奏', deadlineMultiplier: 0.94,
      conflictDelta: 0.03, extraLives: 0,
    };
  }
  return {
    id: 'standard', label: '标准节奏', deadlineMultiplier: 1,
    conflictDelta: 0, extraLives: 0,
  };
}

export function applyAdaptiveMode(level, mode) {
  return {
    ...level,
    deadline: Math.round(level.deadline * mode.deadlineMultiplier),
    conflict: clamp(level.conflict + mode.conflictDelta, 0, 0.95),
    adaptiveMode: mode,
  };
}

export function updateAdaptiveProfile(profile, summary, mode) {
  const accuracySignal = (summary.accuracy - 75) * 1.4;
  const passSignal = summary.passed ? 24 : -32;
  const speedSignal = summary.averageReactionMs > 0 && summary.averageReactionMs < 1400 ? 8 : 0;
  const delta = Math.round(clamp(accuracySignal + passSignal + speedSignal, -55, 55));
  return {
    ...profile,
    adaptive: {
      rating: clamp(profile.adaptive.rating + delta, 600, 1800),
      recentFailures: summary.passed ? 0 : clamp(profile.adaptive.recentFailures + 1, 0, 10),
      assistSessions: profile.adaptive.assistSessions + (mode.id === 'recovery' || mode.id === 'steady' ? 1 : 0),
    },
  };
}
