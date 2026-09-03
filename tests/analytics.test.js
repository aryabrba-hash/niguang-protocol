import test from 'node:test';
import assert from 'node:assert/strict';

import { createSharePayload, summarizeHistory } from '../src/core/analytics.js';

test('趋势统计忽略空局并比较最近两个周期', () => {
  const history = [
    { answered: 0 },
    ...Array.from({ length: 7 }, () => ({ answered: 8, accuracy: 70, averageReactionMs: 1500, passed: true })),
    ...Array.from({ length: 7 }, () => ({ answered: 8, accuracy: 80, averageReactionMs: 1200, passed: true })),
  ];
  const stats = summarizeHistory(history);
  assert.equal(stats.totalSessions, 14);
  assert.equal(stats.totalQuestions, 112);
  assert.equal(stats.accuracyTrend, 10);
});

test('分享文案包含成绩与连续训练信息', () => {
  const payload = createSharePayload({
    mode: 'daily', levelIndex: 0, score: 4321, accuracy: 87,
    maxCombo: 9, averageReactionMs: 980, passed: true,
  }, 3);
  assert.match(payload.title, /今日协议完成/);
  assert.match(payload.text, /4,321/);
  assert.match(payload.text, /连续训练 3 天/);
});
