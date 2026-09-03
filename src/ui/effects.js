import { comboInfo } from '../core/engine.js';

export class EffectsController {
  constructor({ app, canvas, soundEnabled = () => true, motionEnabled = () => true, quality = () => 'standard' }) {
    this.app = app;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.soundEnabled = soundEnabled;
    this.motionEnabled = motionEnabled;
    this.quality = quality;
    this.audioContext = null;
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.frame = 0;
    this.lastFrame = 0;
    this.width = 0;
    this.height = 0;
    this.impactTimer = 0;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.width = width;
    this.height = height;
  }

  clear() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.resize();
    this.context.clearRect(0, 0, this.width, this.height);
  }

  tone(frequency, duration = 0.07, delay = 0, type = 'sine', gain = 0.04) {
    if (!this.soundEnabled()) return;
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) this.audioContext = new AudioEngine();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();
      const startsAt = this.audioContext.currentTime + delay;
      const oscillator = this.audioContext.createOscillator();
      const volume = this.audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      volume.gain.setValueAtTime(gain, startsAt);
      volume.gain.exponentialRampToValueAtTime(0.001, startsAt + duration);
      oscillator.connect(volume);
      volume.connect(this.audioContext.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + duration);
    } catch {
      // Audio is progressive enhancement; gameplay must never depend on it.
    }
  }

  successSound(combo, milestone, flowStarted) {
    const scale = [523, 587, 659, 784, 880];
    const base = scale[Math.min(scale.length - 1, Math.floor((combo - 1) / 2))];
    this.tone(base, 0.09, 0, 'triangle', 0.045);
    this.tone(base * 1.5, 0.07, 0.035, 'sine', 0.022);
    if (milestone) [1, 1.25, 1.5].forEach((ratio, index) => this.tone(base * ratio, 0.16, index * 0.055, 'triangle', 0.035));
    if (flowStarted) {
      this.tone(131, 0.3, 0, 'sine', 0.05);
      this.tone(1047, 0.24, 0.15, 'sine', 0.028);
    }
  }

  failSound(brokenCombo) {
    this.tone(220, 0.13, 0, 'sawtooth', 0.035);
    this.tone(174, 0.15, 0.07, 'sawtooth', 0.03);
    if (brokenCombo >= 3) this.tone(131, 0.2, 0.14, 'triangle', 0.035);
  }

  burst(points, combo, correct = true) {
    if (!this.motionEnabled()) return;
    this.resize();
    const tier = comboInfo(combo);
    const accent = getComputedStyle(this.app).getPropertyValue('--accent').trim() || '#98ff6d';
    const color = correct ? accent : '#ff5477';
    const fullCount = correct ? 12 + tier.level * 5 : 18;
    const count = this.quality() === 'low' ? Math.ceil(fullCount * 0.55) : fullCount;
    const x = this.width / 2;
    const y = this.height * 0.54;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.25;
      const speed = (correct ? 3.8 : 2.8) + Math.random() * 3.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (correct ? 1.2 : 0),
        gravity: correct ? 0.08 : 0.2,
        size: 2 + Math.random() * 5,
        color,
        life: 430 + Math.random() * 210,
        max: 640,
      });
    }
    this.rings.push({ x, y, radius: 12, speed: correct ? 5.5 : 3.5, color, life: correct ? 360 : 260, max: correct ? 360 : 260 });
    this.texts.push({ text: correct ? `+${Math.round(points).toLocaleString('zh-CN')}` : combo ? '连击归零' : '信号中断', x, y: y - 12, speed: 0.75, size: correct ? 22 + tier.level * 2 : 18, color, life: 620, max: 620 });
    if (!this.frame) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame((time) => this.draw(time));
    }
  }

  draw(now) {
    const delta = Math.min(32, Math.max(8, now - (this.lastFrame || now - 16)));
    this.lastFrame = now;
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);
    context.globalCompositeOperation = 'lighter';
    this.particles = this.particles.filter((particle) => {
      particle.life -= delta;
      if (particle.life <= 0) return false;
      particle.x += (particle.vx * delta) / 16;
      particle.y += (particle.vy * delta) / 16;
      particle.vy += (particle.gravity * delta) / 16;
      particle.vx *= 0.985;
      context.globalAlpha = Math.max(0, particle.life / particle.max);
      context.fillStyle = particle.color;
      context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 4, particle.size, particle.size / 2);
      return true;
    });
    this.rings = this.rings.filter((ring) => {
      ring.life -= delta;
      if (ring.life <= 0) return false;
      ring.radius += (ring.speed * delta) / 16;
      context.globalAlpha = Math.max(0, ring.life / ring.max);
      context.strokeStyle = ring.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      context.stroke();
      return true;
    });
    context.globalCompositeOperation = 'source-over';
    this.texts = this.texts.filter((item) => {
      item.life -= delta;
      if (item.life <= 0) return false;
      item.y -= (item.speed * delta) / 16;
      context.globalAlpha = Math.max(0, item.life / item.max);
      context.fillStyle = item.color;
      context.font = `900 ${item.size}px Arial`;
      context.textAlign = 'center';
      context.fillText(item.text, item.x, item.y);
      return true;
    });
    context.globalAlpha = 1;
    if (this.particles.length || this.rings.length || this.texts.length) {
      this.frame = requestAnimationFrame((time) => this.draw(time));
    } else {
      this.frame = 0;
    }
  }

  impact() {
    if (!this.motionEnabled()) return;
    this.app.classList.add('impact');
    clearTimeout(this.impactTimer);
    this.impactTimer = setTimeout(() => this.app.classList.remove('impact'), 270);
  }
}
