import { hashSeed } from './random.js';

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day - 1);
  return localDateKey(date);
}

export function dailySeed(dateKey) {
  return hashSeed(`niguang-daily:${dateKey}`);
}

export function buildDailyLevel(dateKey) {
  const seed = dailySeed(dateKey);
  const variant = seed % 3;
  return {
    id: `daily-${dateKey}`,
    chapter: '每日协议',
    name: '今日挑战',
    goal: '用同一组信号挑战今日状态',
    detail: '同一天的题目顺序固定，可与朋友公平比较。',
    rules: ['word', 'arrow'],
    switchEvery: [3, 2, 2][variant],
    questions: 15,
    conflict: [0.58, 0.66, 0.72][variant],
    deadline: [2700, 2500, 2350][variant],
    feedback: 420,
    target: 0.70,
    focus: null,
    noise: variant === 2 ? 1 : 0,
    dateKey,
    seed,
  };
}

export function recordDailyCompletion(profile, dateKey, summary, now = Date.now()) {
  if (!summary.passed || profile.daily.completedDates.includes(dateKey)) return profile;
  const continued = profile.daily.lastPlayedDate === previousDateKey(dateKey);
  const currentStreak = continued ? profile.daily.currentStreak + 1 : 1;
  return {
    ...profile,
    updatedAt: now,
    daily: {
      lastPlayedDate: dateKey,
      currentStreak,
      longestStreak: Math.max(profile.daily.longestStreak, currentStreak),
      completedDates: [...profile.daily.completedDates, dateKey].slice(-90),
    },
  };
}
