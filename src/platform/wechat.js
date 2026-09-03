import {
  PROFILE_STORAGE_KEY,
  defaultProfile,
  migrateProfile,
} from '../core/profile.js';

// Runtime adapter for the future WeChat Mini Game shell. The game rules in
// src/core stay platform-independent; only presentation and this adapter change.
export class WeChatPlatform {
  constructor(api = globalThis.wx) {
    if (!api) throw new Error('WeChat runtime is unavailable');
    this.api = api;
    this.settings = { sound: true, haptics: true, reducedMotion: false };
  }

  now() {
    return Date.now();
  }

  loadProfile() {
    let raw = null;
    try {
      raw = this.api.getStorageSync(PROFILE_STORAGE_KEY) || null;
      if (typeof raw === 'string') raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
    const profile = migrateProfile(raw, {}, this.now());
    this.setSettings(profile.settings);
    this.saveProfile(profile);
    return profile;
  }

  saveProfile(profile) {
    try {
      this.api.setStorageSync(PROFILE_STORAGE_KEY, profile);
      return true;
    } catch {
      return false;
    }
  }

  resetProfile() {
    const profile = defaultProfile(this.now());
    this.saveProfile(profile);
    this.setSettings(profile.settings);
    return profile;
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  vibrate(pattern = 20) {
    if (!this.settings.haptics || !this.api.vibrateShort) return;
    this.api.vibrateShort({ type: Number(pattern) >= 60 ? 'heavy' : 'light' });
  }

  async share(payload) {
    if (!this.api.shareAppMessage) return 'unsupported';
    this.api.shareAppMessage({ title: `${payload.title} · 来挑战我` });
    return 'shared';
  }

  capabilities() {
    return {
      haptics: Boolean(this.api.vibrateShort),
      nativeShare: Boolean(this.api.shareAppMessage),
    };
  }

  performanceTier() {
    try {
      const info = this.api.getDeviceInfo?.() || this.api.getSystemInfoSync?.() || {};
      return Number(info.benchmarkLevel) > 0 && Number(info.benchmarkLevel) <= 10
        ? 'low'
        : 'standard';
    } catch {
      return 'low';
    }
  }

  onVisibilityChange(handler) {
    const onShow = () => handler(true);
    const onHide = () => handler(false);
    this.api.onShow?.(onShow);
    this.api.onHide?.(onHide);
    return () => {
      this.api.offShow?.(onShow);
      this.api.offHide?.(onHide);
    };
  }
}
