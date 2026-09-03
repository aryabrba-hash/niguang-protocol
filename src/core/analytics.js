export function summarizeHistory(history) {
  const sessions = history.filter((item) => item && item.answered > 0);
  const recent = sessions.slice(-7);
  const previous = sessions.slice(-14, -7);
  const average = (items, key) => items.length
    ? Math.round(items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length)
    : 0;
  const recentAccuracy = average(recent, 'accuracy');
  const previousAccuracy = average(previous, 'accuracy');
  const recentReaction = average(recent, 'averageReactionMs');
  return {
    totalSessions: sessions.length,
    totalQuestions: sessions.reduce((sum, item) => sum + item.answered, 0),
    recent,
    recentAccuracy,
    recentReaction,
    bestAccuracy: sessions.reduce((best, item) => Math.max(best, item.accuracy), 0),
    accuracyTrend: previous.length ? recentAccuracy - previousAccuracy : 0,
    passedSessions: sessions.filter((item) => item.passed).length,
  };
}

export function createSharePayload(summary, dailyStreak = 0) {
  const mode = summary.mode === 'daily' ? '今日协议' : `第 ${summary.levelIndex + 1} 关`;
  const status = summary.passed ? '完成' : '挑战';
  return {
    title: `逆光协议 · ${mode}${status}`,
    text: `我在「逆光协议」${mode}拿到 ${summary.score.toLocaleString('zh-CN')} 分，正确率 ${summary.accuracy}%，最高 ${summary.maxCombo} 连击，平均反应 ${summary.averageReactionMs}ms${dailyStreak ? `，已连续训练 ${dailyStreak} 天` : ''}。你能超过我吗？`,
  };
}
