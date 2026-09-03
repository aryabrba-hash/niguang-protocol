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

  vibrate(pattern) {
    if (this.settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }
}
