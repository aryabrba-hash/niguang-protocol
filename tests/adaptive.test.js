import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptiveMode, applyAdaptiveMode, updateAdaptiveProfile } from '../src/core/adaptive.js';
import { defaultProfile } from '../src/core/profile.js';
import { LEVELS } from '../src/core/config.js';

test('连续失败进入透明恢复模式', () => {
  const profile = defaultProfile(0);
  profile.adaptive.recentFailures = 2;
  const mode = adaptiveMode(profile);
  const level = applyAdaptiveMode(LEVELS[4], mode);
  assert.equal(mode.id, 'recovery');
  assert.ok(level.deadline > LEVELS[4].deadline);
  assert.ok(level.conflict < LEVELS[4].conflict);
});

test('稳定高水平玩家进入进阶节奏', () => {
  const profile = defaultProfile(0);
  profile.adaptive.rating = 1350;
  profile.sessionHistory = Array.from({ length: 5 }, () => ({ answered: 8 }));
  assert.equal(adaptiveMode(profile).id, 'advanced');
});

test('表现更新被限制在安全评级区间', () => {
  const profile = defaultProfile(0);
  profile.adaptive.rating = 1790;
  const updated = updateAdaptiveProfile(profile, {
    accuracy: 100, passed: true, averageReactionMs: 500,
  }, { id: 'standard' });
  assert.equal(updated.adaptive.rating, 1800);
});
