import {
  PROFILE_STORAGE_KEY,
  defaultProfile,
  migrateProfile,
} from '../core/profile.js';

export class BrowserPlatform {
  constructor() {
    this.settings = { sound: true, haptics: true, reducedMotion: false };
  }

  now() {
    return Date.now();
  }

  loadLegacyNumber(key, fallback = 0) {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  saveLegacyNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Private browsing or a full quota should not block a game session.
    }
  }

  loadProfile() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null');
    } catch {
      raw = null;
    }
    const profile = migrateProfile(raw, {
      bestScore: this.loadLegacyNumber('niguang-best', 0),
      unlockedLevel: this.loadLegacyNumber('niguang-unlocked', 1),
    }, this.now());
    if (!raw && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      profile.settings.reducedMotion = true;
    }
    this.setSettings(profile.settings);
    this.saveProfile(profile);
    return profile;
  }

  saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
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

  vibrate(pattern) {
    if (this.settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  async share(payload) {
    const data = { ...payload, url: window.location.href.split('?')[0] };
    if (navigator.share) {
      await navigator.share(data);
      return 'shared';
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
      return 'copied';
    }
    return 'unsupported';
  }

  capabilities() {
    return {
      haptics: Boolean(navigator.vibrate),
      nativeShare: Boolean(navigator.share),
    };
  }
}
