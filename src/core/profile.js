import { LEVELS } from './config.js';
import { clamp } from './engine.js';

export const PROFILE_SCHEMA_VERSION = 2;
export const PROFILE_STORAGE_KEY = 'niguang-player-profile';
export const MAX_SESSION_HISTORY = 60;

export function defaultProfile(now = Date.now()) {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    bestScore: 0,
    unlockedLevel: 1,
    tutorialCompleted: false,
    settings: {
      sound: true,
      haptics: true,
      reducedMotion: false,
      highContrast: false,
    },
    adaptive: {
      rating: 1000,
      recentFailures: 0,
      assistSessions: 0,
    },
    daily: {
      lastPlayedDate: null,
      currentStreak: 0,
      longestStreak: 0,
      completedDates: [],
    },
    sessionHistory: [],
  };
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanSession(session) {
  if (!session || typeof session !== 'object') return null;
  return {
    id: String(session.id || ''),
    finishedAt: finiteNumber(session.finishedAt),
    levelId: String(session.levelId || ''),
    levelIndex: clamp(Math.round(finiteNumber(session.levelIndex)), 0, LEVELS.length - 1),
    mode: session.mode === 'daily' ? 'daily' : 'level',
    score: Math.max(0, Math.round(finiteNumber(session.score))),
    accuracy: clamp(Math.round(finiteNumber(session.accuracy)), 0, 100),
    maxCombo: Math.max(0, Math.round(finiteNumber(session.maxCombo))),
    averageReactionMs: Math.max(0, Math.round(finiteNumber(session.averageReactionMs))),
    answered: Math.max(0, Math.round(finiteNumber(session.answered))),
    passed: Boolean(session.passed),
    seed: Math.max(0, Math.round(finiteNumber(session.seed))),
  };
}

export function migrateProfile(raw, legacy = {}, now = Date.now()) {
  const fallback = defaultProfile(now);
  const source = raw && typeof raw === 'object' ? raw : {};
  const history = Array.isArray(source.sessionHistory)
    ? source.sessionHistory.map(cleanSession).filter(Boolean).slice(-MAX_SESSION_HISTORY)
    : [];
  const settings = source.settings && typeof source.settings === 'object' ? source.settings : {};
  const adaptive = source.adaptive && typeof source.adaptive === 'object' ? source.adaptive : {};
  const daily = source.daily && typeof source.daily === 'object' ? source.daily : {};

  return {
    ...fallback,
    createdAt: Math.max(0, finiteNumber(source.createdAt, now)),
    updatedAt: now,
    bestScore: Math.max(0, Math.round(finiteNumber(source.bestScore, legacy.bestScore || 0))),
    unlockedLevel: clamp(
      Math.round(finiteNumber(source.unlockedLevel, legacy.unlockedLevel || 1)),
      1,
      LEVELS.length,
    ),
    tutorialCompleted: source.tutorialCompleted === undefined
      ? finiteNumber(legacy.bestScore) > 0 || finiteNumber(legacy.unlockedLevel, 1) > 1
      : Boolean(source.tutorialCompleted),
    settings: {
      sound: settings.sound !== false,
      haptics: settings.haptics !== false,
      reducedMotion: Boolean(settings.reducedMotion),
      highContrast: Boolean(settings.highContrast),
    },
    adaptive: {
      rating: clamp(Math.round(finiteNumber(adaptive.rating, 1000)), 600, 1800),
      recentFailures: clamp(Math.round(finiteNumber(adaptive.recentFailures)), 0, 10),
      assistSessions: clamp(Math.round(finiteNumber(adaptive.assistSessions)), 0, 10000),
    },
    daily: {
      lastPlayedDate: typeof daily.lastPlayedDate === 'string' ? daily.lastPlayedDate : null,
      currentStreak: Math.max(0, Math.round(finiteNumber(daily.currentStreak))),
      longestStreak: Math.max(0, Math.round(finiteNumber(daily.longestStreak))),
      completedDates: Array.isArray(daily.completedDates)
        ? [...new Set(daily.completedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))].slice(-90)
        : [],
    },
    sessionHistory: history,
    schemaVersion: PROFILE_SCHEMA_VERSION,
  };
}

export function recordSession(profile, summary, now = Date.now()) {
  const session = cleanSession({
    ...summary,
    id: summary.id || `${now}-${summary.seed}`,
    finishedAt: now,
  });
  const history = [...profile.sessionHistory, session].slice(-MAX_SESSION_HISTORY);
  return {
    ...profile,
    updatedAt: now,
    bestScore: Math.max(profile.bestScore, summary.score),
    unlockedLevel: summary.passed
      ? clamp(Math.max(profile.unlockedLevel, summary.levelIndex + 2), 1, LEVELS.length)
      : profile.unlockedLevel,
    sessionHistory: history,
  };
}

export function updateProfileSettings(profile, changes, now = Date.now()) {
  return migrateProfile({
    ...profile,
    updatedAt: now,
    settings: { ...profile.settings, ...changes },
  }, {}, now);
}

export function completeTutorial(profile, now = Date.now()) {
  return {
    ...profile,
    tutorialCompleted: true,
    updatedAt: now,
  };
}
