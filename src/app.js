import { LEVELS, RULES } from './core/config.js';
import {
  advanceQuestion,
  clamp,
  comboInfo,
  createSession,
  resolveAnswer,
  sessionSummary,
} from './core/engine.js';
import { BrowserPlatform } from './platform/browser.js';
import { EffectsController } from './ui/effects.js';
import { completeTutorial, recordSession, updateProfileSettings } from './core/profile.js';
import { adaptiveMode, applyAdaptiveMode, updateAdaptiveProfile } from './core/adaptive.js';
import { buildDailyLevel, localDateKey, recordDailyCompletion } from './core/daily.js';
import { createSharePayload, summarizeHistory } from './core/analytics.js';

const element = (id) => document.getElementById(id);
const app = element('app');
const controls = [...document.querySelectorAll('[data-dir]')];
const platform = new BrowserPlatform();
const effects = new EffectsController({
  app,
  canvas: element('fxCanvas'),
  soundEnabled: () => platform.settings.sound,
  motionEnabled: () => !platform.settings.reducedMotion,
});

let state;
let profile = platform.loadProfile();
let sessionLevel = null;
let sessionAdaptiveMode = adaptiveMode(profile);
let selectedLevel = 0;
let inputLocked = true;
let questionToken = 0;
let tickTimer = 0;
let nextTimer = 0;
let switchTimer = 0;
let readyTimer = 0;
let bannerTimer = 0;
let tutorialStep = 0;
let lastSummary = null;

const tutorialSteps = [
  {
    kicker: '01 / 03 · 锁定规则',
    title: '先看顶部<br><em>再看题目</em>',
    demo: '<b>本轮看文字</b><span>←　右</span>',
    text: '每道题先确认顶部规则。它写“看文字”，答案就只由汉字决定。',
  },
  {
    kicker: '02 / 03 · 抑制干扰',
    title: '信息会冲突<br><em>规则不会</em>',
    demo: '<b>本轮看箭头</b><span>→　左</span>',
    text: '文字与箭头可能故意打架。不要凭第一眼作答，只服从当前规则。',
  },
  {
    kicker: '03 / 03 · 建立节奏',
    title: '先求正确<br><em>再追连击</em>',
    demo: '<b>3 连击 · 得分 ×2</b><span>✓　✓　✓</span>',
    text: '稳定答对会提高倍率；答错会归零。训练目标是控制反应，不是盲目抢快。',
  },
];

const formatNumber = (value) => Math.round(value).toLocaleString('zh-CN');
const unlockedCount = () => clamp(profile.unlockedLevel, 1, LEVELS.length);
const currentLevel = () => sessionLevel ?? LEVELS[state?.levelIndex ?? selectedLevel];

function setInputReady(ready, label) {
  inputLocked = !ready;
  controls.forEach((button) => { button.disabled = !ready; });
  app.classList.toggle('resolving', !ready);
  element('inputState').textContent = label || (ready ? '● 可以作答' : '○ 下一题准备中');
  if (!ready) {
    element('time').textContent = '—';
    element('rail').style.transform = 'scaleX(0)';
  }
}

function showBanner(text, kind = '') {
  if (!text) return;
  clearTimeout(bannerTimer);
  const banner = element('streakBanner');
  banner.className = 'streak-banner';
  banner.textContent = text;
  void banner.offsetWidth;
  banner.classList.add('show');
  if (kind === 'break') banner.classList.add('break');
  bannerTimer = setTimeout(() => { banner.className = 'streak-banner'; }, 760);
}

function renderHearts() {
  element('hearts').innerHTML = Array.from({ length: state.maxLives || 3 }, (_, index) => index)
    .map((index) => `<span class="heart ${index < state.lives ? 'alive' : ''}">♥</span>`)
    .join('');
}

function renderDistractors() {
  const level = currentLevel();
  const count = level.noise === 2 ? 12 : level.noise === 1 ? 7 : 0;
  const marks = ['←', '→', '左', '右', '×', '○'];
  const random = state?.random ?? Math.random;
  element('distractors').innerHTML = Array.from({ length: count }, () => {
    const mark = marks[Math.floor(random() * marks.length)];
    return `<span style="left:${7 + random() * 82}%;top:${5 + random() * 78}%;transform:rotate(${Math.round(random() * 50 - 25)}deg) scale(${0.7 + random() * 0.8})">${mark}</span>`;
  }).join('');
}

function render() {
  const level = currentLevel();
  const rule = RULES[state.rule];
  const now = platform.now();
  const overdrive = now < state.overUntil;
  const remaining = Math.max(0, state.deadline - now);
  const combo = comboInfo(state.combo);
  const multiplier = combo.multiplier * (overdrive ? 2 : 1);

  app.style.setProperty('--accent', rule.accent);
  app.classList.toggle('overdrive', overdrive);
  app.classList.toggle('focus-word', level.focus === 'word');
  app.classList.toggle('focus-arrow', level.focus === 'arrow');
  app.classList.toggle('noise-1', level.noise === 1);
  app.classList.toggle('noise-2', level.noise === 2);
  app.classList.toggle('combo-hot', state.combo >= 6);
  app.classList.toggle('combo-flow', state.combo >= 10);
  element('stats').disabled = state.playing;

  element('score').textContent = formatNumber(state.score);
  element('combo').textContent = state.combo;
  element('multi').textContent = ` ×${multiplier}`;
  element('comboTier').textContent = overdrive
    ? `${combo.name} · 超载 ×${multiplier}`
    : state.combo > 0 && state.combo < 3
      ? `还差 ${3 - state.combo} 次升到 ×2`
      : combo.name;
  element('comboTier').style.color = combo.color;
  element('time').textContent = (remaining / 1000).toFixed(1);
  element('ruleId').textContent = level.rules.length > 1 ? '规则切换' : '规则锁定';
  element('ruleTitle').textContent = rule.title;
  element('ruleHint').textContent = rule.hint;
  element('levelLabel').textContent = state.mode === 'daily'
    ? `今日协议 · ${level.dateKey.slice(5)}`
    : `关卡 ${String(state.levelIndex + 1).padStart(2, '0')} · ${level.chapter}`;
  element('levelGoal').textContent = level.goal;
  element('questionProgress').textContent = `${String(state.turn + 1).padStart(2, '0')} / ${String(level.questions).padStart(2, '0')}`;
  element('adaptiveBadge').textContent = state.mode === 'daily' ? '同日同题' : sessionAdaptiveMode.label;
  element('adaptiveBadge').classList.toggle('hidden', state.mode !== 'daily' && (sessionAdaptiveMode.id === 'standard' || !state.playing));
  element('arrow').textContent = state.prompt.arrow === 'left' ? '←' : '→';
  element('word').textContent = state.prompt.word === 'left' ? '左' : '右';
  element('signalId').textContent = `SIGNAL / ${String(state.turn + 1).padStart(2, '0')}`;
  element('energyName').textContent = overdrive ? '超载中 · 双倍' : '超载能量';
  element('energyText').textContent = overdrive ? '2X' : `${state.energy}%`;
  element('energyBar').style.width = `${overdrive ? 100 : state.energy}%`;
  renderHearts();
}

function armQuestion(level) {
  const token = ++questionToken;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!state.playing || token !== questionToken) return;
    const now = platform.now();
    state.deadline = now + level.deadline;
    state.questionStartedAt = now;
    setInputReady(true);
    element('rail').style.transform = 'scaleX(1)';
    app.classList.add('question-ready');
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => app.classList.remove('question-ready'), 180);
  }));
}

function setQuestion(first = false) {
  if (!state.playing) return;
  const level = currentLevel();
  questionToken += 1;
  if (!first) state = advanceQuestion(state, level, platform.now());
  app.classList.remove('hit', 'miss', 'switching', 'question-ready');
  if (state.justSwitched) {
    element('feedback').textContent = `规则切换 · ${RULES[state.rule].title}`;
    app.classList.add('switching');
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => app.classList.remove('switching'), 420);
  } else {
    element('feedback').textContent = '';
  }
  render();
  setInputReady(false, '○ 新题加载中');
  armQuestion(level);
}

function stopTimers() {
  clearInterval(tickTimer);
  clearTimeout(nextTimer);
  clearTimeout(switchTimer);
  clearTimeout(readyTimer);
  clearTimeout(bannerTimer);
}

function finishLevel() {
  if (!state.playing) return;
  state.playing = false;
  element('stats').disabled = false;
  questionToken += 1;
  stopTimers();
  effects.clear();
  setInputReady(false, '○ 本关已结束');
  app.classList.remove('question-ready', 'impact');

  const level = currentLevel();
  const summary = sessionSummary(state, level);
  lastSummary = summary;
  state.passed = summary.passed;
  if (summary.mode === 'level') profile = updateAdaptiveProfile(profile, summary, sessionAdaptiveMode);
  if (summary.mode === 'daily') profile = recordDailyCompletion(profile, currentLevel().dateKey, summary, platform.now());
  profile = recordSession(profile, summary, platform.now());
  platform.saveProfile(profile);
  const best = profile.bestScore;

  element('bestTop').textContent = formatNumber(best);
  element('finalScore').textContent = formatNumber(state.score);
  element('accuracy').textContent = `${summary.accuracy}%`;
  element('averageReaction').textContent = `${summary.averageReactionMs}ms`;
  element('maxCombo').textContent = state.maxCombo;
  element('bestEnd').textContent = formatNumber(best);
  element('levelResult').textContent = summary.mode === 'daily'
    ? summary.passed ? '✓ 今日协议完成' : '今日协议未完成'
    : summary.passed ? `✓ 第 ${state.levelIndex + 1} 关通过` : `第 ${state.levelIndex + 1} 关未通过`;
  element('rank').textContent = summary.mode === 'daily'
    ? summary.passed ? `连续完成 ${profile.daily.currentStreak} 天` : `目标正确率 ${Math.round(level.target * 100)}% · 再稳一次`
    : summary.passed ? `已学会：${level.goal}` : `目标正确率 ${Math.round(level.target * 100)}% · 再稳一次`;
  element('again').textContent = summary.mode === 'daily'
    ? '↻　再挑战今日协议'
    : summary.passed && state.levelIndex < LEVELS.length - 1 ? '下一关　→' : '↻　再试一次';
  element('resultTip').textContent = summary.mode === 'daily' && summary.passed
    ? '同一天题序固定，下一次可以挑战更快反应'
    : summary.passed ? '新规则已写入你的关卡记录'
    : profile.adaptive.recentFailures >= 2
      ? '下一局将开启恢复模式：更多反应时间与一次额外容错'
      : '看顶部规则，先正确再追求速度';
  element('endOverlay').classList.remove('hidden');
  effects.tone(summary.passed ? 660 : 220, 0.24);
  renderLevelMenu();
}

function answer(choice) {
  if (!state.playing || inputLocked || state.paused) return;
  questionToken += 1;
  setInputReady(false, '○ 答案已锁定');
  app.classList.remove('question-ready');

  const level = currentLevel();
  const result = resolveAnswer(state, level, choice, platform.now());
  state = result.state;
  const event = result.event;

  if (event.type === 'correct') {
    app.classList.add('hit');
    element('feedback').textContent = state.justSwitched
      ? `你成功切换了规则 · +${formatNumber(event.points)}`
      : event.flowStarted
        ? `心流超载启动 · +${formatNumber(event.points)}`
        : `完美同步 · +${formatNumber(event.points)}`;
    effects.burst(event.points, state.combo, true);
    effects.impact();
    showBanner(event.milestone);
    effects.successSound(state.combo, Boolean(event.milestone), event.flowStarted);
    platform.vibrate(event.milestone ? [12, 18, 18] : 10);
  } else {
    app.classList.add('miss');
    const rule = RULES[state.rule];
    const actual = state.rule === 'word'
      ? `文字是${state.prompt.word === 'left' ? '左' : '右'}`
      : `箭头指向${state.prompt.arrow === 'left' ? '左' : '右'}`;
    const breakText = event.brokenCombo ? `连击中断 ${event.brokenCombo} → 0 · ` : '';
    const timeoutText = event.type === 'timeout' ? '超时 · ' : '';
    element('feedback').textContent = `${breakText}${timeoutText}本题该看${rule.source} · ${actual}`;
    effects.burst(0, event.brokenCombo, false);
    showBanner(event.brokenCombo >= 2 ? `${event.brokenCombo} 连击中断 · 从 0 开始` : '', 'break');
    effects.failSound(event.brokenCombo);
    platform.vibrate([28, 20, 28]);
  }

  render();
  setInputReady(false, '○ 答案已锁定');
  const complete = state.lives <= 0 || state.answered >= level.questions;
  nextTimer = setTimeout(complete ? finishLevel : () => setQuestion(), level.feedback);
}

function tick() {
  if (!state.playing || inputLocked || state.paused) return;
  const level = currentLevel();
  const now = platform.now();
  const remaining = Math.max(0, state.deadline - now);
  element('time').textContent = (remaining / 1000).toFixed(1);
  element('rail').style.transform = `scaleX(${clamp(remaining / level.deadline, 0, 1)})`;
  app.classList.toggle('overdrive', now < state.overUntil);
  if (now >= state.deadline) answer(null);
}

function beginSession(index, level, options = {}) {
  stopTimers();
  effects.clear();
  questionToken += 1;
  selectedLevel = index;
  sessionLevel = level;
  state = createSession(index, { level, now: platform.now(), ...options });
  element('startOverlay').classList.add('hidden');
  element('endOverlay').classList.add('hidden');
  element('feedback').textContent = '';
  element('streakBanner').className = 'streak-banner';
  app.classList.remove('hit', 'miss', 'overdrive', 'switching', 'question-ready', 'impact', 'combo-hot', 'combo-flow');
  renderDistractors();
  render();
  setInputReady(false, '○ 新题加载中');
  armQuestion(currentLevel());
  tickTimer = setInterval(tick, 100);
  effects.tone(440, 0.09);
}

function startLevel(index) {
  sessionAdaptiveMode = adaptiveMode(profile);
  const level = applyAdaptiveMode(LEVELS[index], sessionAdaptiveMode);
  beginSession(index, level, { lives: 3 + sessionAdaptiveMode.extraLives, mode: 'level' });
}

function startDaily() {
  const dateKey = localDateKey();
  const level = buildDailyLevel(dateKey);
  sessionAdaptiveMode = { id: 'daily', label: '同日同题', extraLives: 1 };
  beginSession(5, level, { seed: level.seed, lives: 4, mode: 'daily' });
}

function selectLevel(index) {
  selectedLevel = index;
  const level = LEVELS[index];
  element('menuKicker').textContent = `✦ ${level.chapter} · 关卡 ${String(index + 1).padStart(2, '0')}`;
  element('lessonGoal').textContent = level.goal;
  element('lessonDetail').textContent = level.detail;
  element('start').textContent = `开始第 ${index + 1} 关　→`;
  renderLevelMenu();
}

function renderLevelMenu() {
  const open = unlockedCount();
  element('levelMap').innerHTML = LEVELS.map((level, index) => `
    <button data-level="${index}" class="${index < open ? 'unlocked' : ''} ${index === selectedLevel ? 'selected' : ''}" ${index >= open ? 'disabled' : ''}>
      ${index + 1}<br>${index < open ? level.name : '未解锁'}
    </button>
  `).join('');
  element('levelMap').querySelectorAll('[data-level]').forEach((button) => {
    button.addEventListener('click', () => selectLevel(Number(button.dataset.level)));
  });
}

function showLevelMenu() {
  state.playing = false;
  element('stats').disabled = false;
  questionToken += 1;
  stopTimers();
  effects.clear();
  sessionLevel = null;
  setInputReady(false, '○ 等待开始');
  selectedLevel = Math.min(selectedLevel, unlockedCount() - 1);
  selectLevel(selectedLevel);
  element('endOverlay').classList.add('hidden');
  element('startOverlay').classList.remove('hidden');
  renderDailyCard();
}

function renderDailyCard() {
  const dateKey = localDateKey();
  const complete = profile.daily.completedDates.includes(dateKey);
  element('dailyTitle').textContent = complete ? '今日已完成 · 再刷纪录' : '每日同题挑战';
  element('dailyMeta').textContent = `连续 ${profile.daily.currentStreak} 天 · 15 题 · ${dateKey.slice(5)}`;
}

function renderStats() {
  const stats = summarizeHistory(profile.sessionHistory);
  element('totalSessions').textContent = stats.totalSessions;
  element('totalQuestions').textContent = stats.totalQuestions;
  element('bestAccuracy').textContent = `${stats.bestAccuracy}%`;
  element('trendText').textContent = stats.totalSessions
    ? `${stats.recentAccuracy}% · ${stats.accuracyTrend > 0 ? `提升 ${stats.accuracyTrend}` : stats.accuracyTrend < 0 ? `波动 ${Math.abs(stats.accuracyTrend)}` : '保持稳定'}`
    : '等待首次训练';
  element('trendChart').innerHTML = stats.recent.length
    ? stats.recent.map((session) => `<i style="height:${Math.max(3, session.accuracy)}%" data-value="${session.accuracy}%"></i>`).join('')
    : '<span class="trend-empty">完成一局后，这里会出现趋势</span>';
}

function openStats() {
  renderStats();
  element('statsOverlay').classList.remove('hidden');
}

function renderTutorial() {
  const step = tutorialSteps[tutorialStep];
  element('tutorialKicker').textContent = step.kicker;
  element('tutorialTitle').innerHTML = step.title;
  element('tutorialDemo').innerHTML = step.demo;
  element('tutorialText').textContent = step.text;
  element('tutorialNext').textContent = tutorialStep === tutorialSteps.length - 1 ? '开始训练　→' : '明白，下一步　→';
  document.querySelectorAll('.tutorial-progress i').forEach((bar, index) => bar.classList.toggle('active', index <= tutorialStep));
}

function finishTutorial() {
  profile = completeTutorial(profile, platform.now());
  platform.saveProfile(profile);
  element('tutorialOverlay').classList.add('hidden');
  element('start').focus();
}

controls.forEach((button) => button.addEventListener('pointerdown', () => answer(button.dataset.dir)));
document.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') answer('left');
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') answer('right');
});

element('start').addEventListener('click', () => startLevel(selectedLevel));
element('again').addEventListener('click', () => {
  if (state.mode === 'daily') startDaily();
  else startLevel(state.passed && state.levelIndex < LEVELS.length - 1 ? state.levelIndex + 1 : state.levelIndex);
});
element('levelSelect').addEventListener('click', showLevelMenu);
element('dailyStart').addEventListener('click', startDaily);
element('stats').addEventListener('click', openStats);
element('homeStats').addEventListener('click', openStats);
element('resultStats').addEventListener('click', openStats);
element('statsClose').addEventListener('click', () => element('statsOverlay').classList.add('hidden'));
element('shareResult').addEventListener('click', async () => {
  if (!lastSummary) return;
  const button = element('shareResult');
  try {
    const result = await platform.share(createSharePayload(lastSummary, profile.daily.currentStreak));
    button.textContent = result === 'copied' ? '成绩文案已复制' : result === 'shared' ? '分享完成' : '当前浏览器暂不支持分享';
  } catch {
    button.textContent = '已取消分享';
  }
  setTimeout(() => { button.textContent = '分享这次成绩'; }, 1800);
});
element('sound').addEventListener('click', () => {
  profile = updateProfileSettings(profile, { sound: !platform.settings.sound }, platform.now());
  platform.setSettings(profile.settings);
  platform.saveProfile(profile);
  element('sound').textContent = platform.settings.sound ? '◕' : '○';
  element('sound').ariaLabel = platform.settings.sound ? '关闭音效' : '开启音效';
});
element('tutorialNext').addEventListener('click', () => {
  if (tutorialStep < tutorialSteps.length - 1) {
    tutorialStep += 1;
    renderTutorial();
  } else {
    finishTutorial();
  }
});
element('tutorialSkip').addEventListener('click', finishTutorial);

selectedLevel = unlockedCount() - 1;
state = createSession(selectedLevel, { now: platform.now() });
state.playing = false;
element('bestTop').textContent = formatNumber(profile.bestScore);
selectLevel(selectedLevel);
renderDailyCard();
renderDistractors();
render();
setInputReady(false, '○ 等待开始');
if (!profile.tutorialCompleted) {
  renderTutorial();
  element('tutorialOverlay').classList.remove('hidden');
}
