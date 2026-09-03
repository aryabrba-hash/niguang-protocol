import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advanceQuestion,
  correctDirection,
  createSession,
  resolveAnswer,
  sessionSummary,
} from '../src/core/engine.js';
import { LEVELS } from '../src/core/config.js';

test('同一种子生成完全相同的挑战序列', () => {
  const level = LEVELS[6];
  let first = createSession(6, { seed: 20260903, now: 0 });
  let second = createSession(6, { seed: 20260903, now: 0 });

  for (let turn = 0; turn < level.questions; turn += 1) {
    assert.deepEqual(first.prompt, second.prompt);
    assert.equal(first.rule, second.rule);
    first = advanceQuestion(first, level, turn * 1000);
    second = advanceQuestion(second, level, turn * 1000);
  }
});

test('答对建立连击与倍率，答错立即清零且扣除生命', () => {
  const level = LEVELS[0];
  let state = createSession(0, { seed: 42, now: 0 });

  for (let answer = 0; answer < 3; answer += 1) {
    const result = resolveAnswer(state, level, correctDirection(state), state.questionStartedAt + 600);
    state = result.state;
    if (answer < 2) state = advanceQuestion(state, level, state.questionStartedAt + 1000);
    if (answer === 2) {
      assert.equal(result.event.multiplier, 2);
      assert.match(result.event.milestone, /节奏锁定/);
    }
  }

  const broken = resolveAnswer(state, level, state.prompt.word === 'left' ? 'right' : 'left', state.questionStartedAt + 700);
  assert.equal(broken.state.combo, 0);
  assert.equal(broken.state.lives, 2);
  assert.equal(broken.event.brokenCombo, 3);
});

test('结算正确计算正确率、反应时间和过关状态', () => {
  const level = { ...LEVELS[0], questions: 4, target: 0.75 };
  const state = {
    ...createSession(0, { level, seed: 7, now: 0 }),
    answered: 4,
    correctCount: 3,
    totalReactionMs: 4000,
    score: 900,
    maxCombo: 3,
  };
  const summary = sessionSummary(state, level);
  assert.equal(summary.accuracy, 75);
  assert.equal(summary.averageReactionMs, 1000);
  assert.equal(summary.passed, true);
});
