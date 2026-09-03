import test from 'node:test';
import assert from 'node:assert/strict';

import { WeChatPlatform } from '../src/platform/wechat.js';

function mockApi() {
  const storage = new Map();
  return {
    storage, vibrations: [], shares: [],
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    vibrateShort(options) { this.vibrations.push(options); },
    shareAppMessage(options) { this.shares.push(options); },
    getDeviceInfo: () => ({ benchmarkLevel: 8 }),
  };
}

test('微信适配层支持存档、弱机识别、触感和分享', async () => {
  const api = mockApi();
  const platform = new WeChatPlatform(api);
  const profile = platform.loadProfile();
  profile.bestScore = 999;
  assert.equal(platform.saveProfile(profile), true);
  assert.equal(platform.loadProfile().bestScore, 999);
  assert.equal(platform.performanceTier(), 'low');
  platform.vibrate(80);
  assert.deepEqual(api.vibrations[0], { type: 'heavy' });
  assert.equal(await platform.share({ title: '成绩', text: '999 分' }), 'shared');
  assert.match(api.shares[0].title, /来挑战我/);
});
