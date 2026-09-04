import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LEVELS,
  livesForLevel,
  requiredCorrectAnswers,
} from '../src/core/config.js';

test('主线包含 20 个唯一且完整的关卡', () => {
  assert.equal(LEVELS.length, 20);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, 20);
  for (const level of LEVELS) {
    assert.ok(level.goal && level.detail && level.name && level.chapter);
    assert.ok(level.questions >= 8 && level.questions <= 14);
  }
});

test('后八关难度有硬上限且包含恢复节奏', () => {
  const lateGame = LEVELS.slice(12);
  for (const level of lateGame) {
    assert.ok(level.deadline >= 2500, `${level.name} 的反应窗过短`);
    assert.ok(level.conflict <= 0.78, `${level.name} 的冲突率过高`);
    assert.ok(level.switchEvery >= 2, `${level.name} 不应每题切换`);
    assert.ok(level.target <= 0.70, `${level.name} 的通关线过高`);
  }
  assert.equal(LEVELS.filter((level) => level.checkpoint).length, 3);
});

test('每关生命数允许玩家用最低合格正确率通关', () => {
  for (const level of LEVELS) {
    const required = requiredCorrectAnswers(level);
    const allowedMisses = level.questions - required;
    const lives = livesForLevel(level);
    assert.ok(lives - allowedMisses > 0, `${level.name} 会在合格成绩前提前出局`);
    assert.equal(lives - (allowedMisses + 1), 0, `${level.name} 的生命容错与通关线不一致`);
    assert.ok(Math.round((required / level.questions) * 100) >= Math.round(level.target * 100));
  }
});
