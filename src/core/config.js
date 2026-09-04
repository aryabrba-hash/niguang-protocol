export const APP_VERSION = '0.5.0';

export const RULES = Object.freeze({
  word: Object.freeze({
    id: 'word',
    title: '本轮看文字',
    source: '文字',
    hint: '答案由汉字决定',
    accent: '#98ff6d',
  }),
  arrow: Object.freeze({
    id: 'arrow',
    title: '本轮看箭头',
    source: '箭头',
    hint: '答案由箭头方向决定',
    accent: '#6de8ff',
  }),
});

export const LEVELS = Object.freeze([
  {
    id: 'word-calibration', chapter: '单一规则', name: '文字校准',
    goal: '文字决定答案', detail: '箭头会被弱化，只看汉字，先把反应做稳。',
    rules: ['word'], switchEvery: 99, questions: 8, conflict: 0,
    deadline: 3600, feedback: 720, target: 0.75, focus: 'word', noise: 0,
  },
  {
    id: 'arrow-calibration', chapter: '单一规则', name: '箭头校准',
    goal: '箭头方向决定答案', detail: '汉字会被弱化，只跟随箭头方向。',
    rules: ['arrow'], switchEvery: 99, questions: 8, conflict: 0,
    deadline: 3500, feedback: 700, target: 0.75, focus: 'arrow', noise: 0,
  },
  {
    id: 'word-conflict-intro', chapter: '规则冲突', name: '文字微扰',
    goal: '第一次冲突时仍看文字', detail: '少量箭头会故意指错，答案仍然只由汉字决定。',
    rules: ['word'], switchEvery: 99, questions: 9, conflict: 0.18,
    deadline: 3500, feedback: 680, target: 0.72, focus: null, noise: 0,
  },
  {
    id: 'arrow-conflict-intro', chapter: '规则冲突', name: '箭头微扰',
    goal: '第一次冲突时仍看箭头', detail: '少量汉字会说反话，只按箭头真正指向的方向。',
    rules: ['arrow'], switchEvery: 99, questions: 9, conflict: 0.24,
    deadline: 3400, feedback: 660, target: 0.72, focus: null, noise: 0,
  },
  {
    id: 'word-conflict', chapter: '规则冲突', name: '文字抗扰',
    goal: '连续冲突时坚持文字规则', detail: '冲突变得更常见，但规则固定，不需要切换。',
    rules: ['word'], switchEvery: 99, questions: 10, conflict: 0.38,
    deadline: 3300, feedback: 630, target: 0.70, focus: null, noise: 0,
  },
  {
    id: 'arrow-conflict', chapter: '规则冲突', name: '箭头抗扰',
    goal: '连续冲突时坚持箭头规则', detail: '克制读字冲动，稳定提取箭头方向。',
    rules: ['arrow'], switchEvery: 99, questions: 10, conflict: 0.46,
    deadline: 3200, feedback: 610, target: 0.70, focus: null, noise: 0,
  },
  {
    id: 'switch-five', chapter: '规则切换', name: '五题换挡',
    goal: '每五题确认一次新规则', detail: '第一次切换只配少量冲突，顶部会提前说明当前规则。',
    rules: ['word', 'arrow'], switchEvery: 5, questions: 10, conflict: 0.30,
    deadline: 3200, feedback: 600, target: 0.70, focus: null, noise: 0,
  },
  {
    id: 'switch-five-conflict', chapter: '规则切换', name: '五题交错',
    goal: '换挡后处理更明显的冲突', detail: '切换频率不变，只增加一点文字与箭头的冲突。',
    rules: ['word', 'arrow'], switchEvery: 5, questions: 10, conflict: 0.42,
    deadline: 3100, feedback: 570, target: 0.70, focus: null, noise: 0,
  },
  {
    id: 'switch-four', chapter: '规则切换', name: '四题换挡',
    goal: '每四题重新确认当前规则', detail: '只把换挡提前一题，其余节奏保持稳定。',
    rules: ['word', 'arrow'], switchEvery: 4, questions: 12, conflict: 0.42,
    deadline: 3000, feedback: 540, target: 0.72, focus: null, noise: 0,
  },
  {
    id: 'switch-four-conflict', chapter: '规则切换', name: '四题交错',
    goal: '四题换挡时抵抗冲突', detail: '切换频率保持不变，只提高冲突出现的概率。',
    rules: ['word', 'arrow'], switchEvery: 4, questions: 12, conflict: 0.50,
    deadline: 2950, feedback: 510, target: 0.72, focus: null, noise: 0,
  },
  {
    id: 'switch-three', chapter: '规则切换', name: '三题换挡',
    goal: '切换后迅速服从新规则', detail: '每三题换挡，但仍保留充足的观察时间。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.52,
    deadline: 2850, feedback: 500, target: 0.70, focus: null, noise: 0,
  },
  {
    id: 'switch-consolidation', chapter: '规则切换', name: '稳态复盘',
    goal: '把三题换挡做稳', detail: '巩固关会略微降低冲突、放宽时间，让大脑形成稳定节奏。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.42,
    deadline: 3000, feedback: 520, target: 0.70, focus: null, noise: 0,
    checkpoint: true,
  },
  {
    id: 'inhibition-entry', chapter: '干扰抑制', name: '边缘信号',
    goal: '忽略第一层外围干扰', detail: '外围会出现无关符号；顶部规则和中央信号仍最清晰。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.55,
    deadline: 2900, feedback: 480, target: 0.70, focus: null, noise: 1,
  },
  {
    id: 'inhibition-focus', chapter: '干扰抑制', name: '中央锁定',
    goal: '有干扰时仍锁定中央信号', detail: '干扰样式不变，只增加冲突密度。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.62,
    deadline: 2800, feedback: 460, target: 0.70, focus: null, noise: 1,
  },
  {
    id: 'inhibition-pairs', chapter: '干扰抑制', name: '双拍换挡',
    goal: '每两题更新一次规则', detail: '换挡加快，但冲突略微回落，给你时间适应新频率。',
    rules: ['word', 'arrow'], switchEvery: 2, questions: 14, conflict: 0.60,
    deadline: 2800, feedback: 440, target: 0.70, focus: null, noise: 1,
  },
  {
    id: 'inhibition-checkpoint', chapter: '干扰抑制', name: '专注补给',
    goal: '在轻松一轮中恢复稳定', detail: '巩固关降低换挡和冲突强度，不让疲劳累积成挫败。',
    rules: ['word', 'arrow'], switchEvery: 4, questions: 12, conflict: 0.56,
    deadline: 3000, feedback: 500, target: 0.70, focus: null, noise: 1,
    checkpoint: true,
  },
  {
    id: 'inhibition-density', chapter: '干扰抑制', name: '密集回声',
    goal: '在密集冲突中保持双拍节奏', detail: '恢复双拍换挡并提高冲突，但反应时间仍然充足。',
    rules: ['word', 'arrow'], switchEvery: 2, questions: 14, conflict: 0.68,
    deadline: 2700, feedback: 420, target: 0.70, focus: null, noise: 1,
  },
  {
    id: 'inhibition-storm', chapter: '干扰抑制', name: '逆光风场',
    goal: '在双层干扰中提取目标', detail: '增加第二层视觉干扰，但不会缩短到难以反应。',
    rules: ['word', 'arrow'], switchEvery: 2, questions: 14, conflict: 0.74,
    deadline: 2600, feedback: 400, target: 0.70, focus: null, noise: 2,
  },
  {
    id: 'flow-rebuild', chapter: '干扰抑制', name: '心流重整',
    goal: '在最终挑战前重建长连击', detail: '巩固关降低干扰与换挡频率，让你找回稳定和爽感。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.64,
    deadline: 2850, feedback: 450, target: 0.70, focus: null, noise: 1,
    checkpoint: true,
  },
  {
    id: 'final-protocol', chapter: '干扰抑制', name: '完整协议',
    goal: '稳定完成完整训练协议', detail: '最终关整合双拍换挡、冲突与干扰；难度有上限，稳住即可通过。',
    rules: ['word', 'arrow'], switchEvery: 2, questions: 14, conflict: 0.78,
    deadline: 2500, feedback: 380, target: 0.70, focus: null, noise: 2,
  },
]);

export function requiredCorrectAnswers(level) {
  const targetPercent = Math.round(level.target * 100);
  for (let correct = 0; correct <= level.questions; correct += 1) {
    if (Math.round((correct / level.questions) * 100) >= targetPercent) return correct;
  }
  return level.questions;
}

export function livesForLevel(level, extraLives = 0) {
  const allowedMisses = level.questions - requiredCorrectAnswers(level);
  return Math.max(3, allowedMisses + 1 + extraLives);
}

export const COMBO_TIERS = Object.freeze([
  { min: 10, name: '心流爆发', multiplier: 4, level: 3, color: '#ffcf5a' },
  { min: 6, name: '神经超频', multiplier: 3, level: 2, color: '#6de8ff' },
  { min: 3, name: '节奏锁定', multiplier: 2, level: 1, color: '#98ff6d' },
  { min: 0, name: '同步中', multiplier: 1, level: 0, color: '#71817e' },
]);
