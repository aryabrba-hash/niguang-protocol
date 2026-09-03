export const APP_VERSION = '0.3.0';

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
    id: 'word-conflict', chapter: '规则冲突', name: '文字抗扰',
    goal: '冲突时仍然只看文字', detail: '文字和箭头开始打架，答案仍由文字决定。',
    rules: ['word'], switchEvery: 99, questions: 10, conflict: 0.38,
    deadline: 3300, feedback: 650, target: 0.75, focus: null, noise: 0,
  },
  {
    id: 'arrow-conflict', chapter: '规则冲突', name: '箭头抗扰',
    goal: '冲突时仍然只看箭头', detail: '克制读字冲动，只按箭头真正指向的方向。',
    rules: ['arrow'], switchEvery: 99, questions: 10, conflict: 0.55,
    deadline: 3100, feedback: 580, target: 0.75, focus: null, noise: 0,
  },
  {
    id: 'switch-five', chapter: '规则切换', name: '五题一换',
    goal: '每五题确认一次新规则', detail: '顶部会明确提示“本轮看文字”或“本轮看箭头”。',
    rules: ['word', 'arrow'], switchEvery: 5, questions: 12, conflict: 0.42,
    deadline: 3000, feedback: 540, target: 0.75, focus: null, noise: 0,
  },
  {
    id: 'switch-three', chapter: '规则切换', name: '三题一换',
    goal: '切换后立刻服从新规则', detail: '每三题切换一次，反馈时间开始缩短。',
    rules: ['word', 'arrow'], switchEvery: 3, questions: 12, conflict: 0.62,
    deadline: 2600, feedback: 430, target: 0.75, focus: null, noise: 0,
  },
  {
    id: 'inhibition-echo', chapter: '干扰抑制', name: '旧规则残影',
    goal: '频繁切换时抑制旧规则', detail: '每两题换挡，冲突更密，并出现外围干扰信号。',
    rules: ['word', 'arrow'], switchEvery: 2, questions: 14, conflict: 0.78,
    deadline: 2200, feedback: 340, target: 0.70, focus: null, noise: 1,
  },
  {
    id: 'inhibition-storm', chapter: '干扰抑制', name: '逆光风暴',
    goal: '强干扰中只提取目标信号', detail: '每题切换、高冲突、短反馈；只相信顶部规则。',
    rules: ['word', 'arrow'], switchEvery: 1, questions: 14, conflict: 0.90,
    deadline: 1800, feedback: 250, target: 0.70, focus: null, noise: 2,
  },
]);

export const COMBO_TIERS = Object.freeze([
  { min: 10, name: '心流爆发', multiplier: 4, level: 3, color: '#ffcf5a' },
  { min: 6, name: '神经超频', multiplier: 3, level: 2, color: '#6de8ff' },
  { min: 3, name: '节奏锁定', multiplier: 2, level: 1, color: '#98ff6d' },
  { min: 0, name: '同步中', multiplier: 1, level: 0, color: '#71817e' },
]);
