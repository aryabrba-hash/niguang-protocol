import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_SESSION_HISTORY,
  defaultProfile,
  migrateProfile,
  recordSession,
} from '../src/core/profile.js';
import { recordDailyCompletion } from '../src/core/daily.js';

test('损坏或旧版存档会被安全迁移', () => {
  const migrated = migrateProfile({
    bestScore: 'nope',
    unlockedLevel: 999,
    settings: { sound: false },
    adaptive: { rating: Infinity },
  }, { bestScore: 88 }, 1234);

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.unlockedLevel, 8);
  assert.equal(migrated.settings.sound, false);
  assert.equal(migrated.settings.haptics, true);
  assert.equal(Number.isFinite(migrated.adaptive.rating), true);
});

test('训练历史有上限且过关只解锁下一关', () => {
  let profile = defaultProfile(0);
  for (let index = 0; index < MAX_SESSION_HISTORY + 5; index += 1) {
    profile = recordSession(profile, {
      levelId: 'word-calibration', levelIndex: 0, mode: 'level', score: index,
      accuracy: 100, maxCombo: 8, averageReactionMs: 900, answered: 8,
      passed: true, seed: index,
    }, index + 1);
  }
  assert.equal(profile.sessionHistory.length, MAX_SESSION_HISTORY);
  assert.equal(profile.unlockedLevel, 2);
  assert.equal(profile.bestScore, MAX_SESSION_HISTORY + 4);
});

test('每日连续训练只在通过且日期连续时增长', () => {
  let profile = defaultProfile(0);
  profile = recordDailyCompletion(profile, '2026-09-02', { passed: true }, 1);
  profile = recordDailyCompletion(profile, '2026-09-03', { passed: true }, 2);
  profile = recordDailyCompletion(profile, '2026-09-03', { passed: true }, 3);
  assert.equal(profile.daily.currentStreak, 2);
  assert.equal(profile.daily.completedDates.length, 2);
});
