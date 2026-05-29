// ══════════════════════════════════════════════════════════════════
//  PIXEL PLATFORMER — game.js  (Visual Upgrade Edition)
// ══════════════════════════════════════════════════════════════════

// ─── SOUND MANAGER ───────────────────────────────────────────────
class SoundManager {
  constructor() {
    this.ctx    = null;
    this.master = null;
    this.muted  = false;
    this._phaserBGM = null;
  }
  _init() {
    if (this.ctx) return;
    this.ctx    = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
  }
  _resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  _osc(freq, type, start, dur, vol, freqEnd) {
    if (!this.ctx) return;
    const g = this.ctx.createGain(), osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(start); osc.stop(start + dur + 0.01);
  }
  _noise(start, dur, vol) {
    if (!this.ctx) return;
    const n = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(g); g.connect(this.master); src.start(start);
  }
  coin() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(880, 'sine', t, 0.07, 0.35);
    this._osc(1320, 'sine', t + 0.06, 0.10, 0.30);
    this._osc(1760, 'sine', t + 0.13, 0.09, 0.25);
  }
  jump() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(200, 'square', t, 0.15, 0.20, 450);
  }
  stomp() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.07, 0.28);
    this._osc(110, 'square', t, 0.10, 0.22);
  }
  ouch() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(300, 'sawtooth', t, 0.28, 0.30, 75);
  }
  levelClear() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => this._osc(f, 'sine', t + i * 0.13, 0.18, 0.32));
  }
  gameClear() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319, 1047, 784, 1319, 1047].forEach((f, i) =>
      this._osc(f, 'sine', t + i * 0.12, 0.20, 0.28));
    this._osc(523, 'triangle', t + 1.1, 0.5, 0.15);
  }
  gameOver() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [440, 370, 311, 220].forEach((f, i) => this._osc(f, 'sawtooth', t + i * 0.22, 0.28, 0.24));
  }
  setScene(scene) { this._scene = scene; }
  startBGM() {
    this.stopBGM();
    if (this.muted || !this._scene) return;
    if (!this._scene.cache.audio.exists('bgm')) return;
    this._phaserBGM = this._scene.sound.add('bgm', { loop: true, volume: 0.45 });
    this._phaserBGM.play();
  }
  stopBGM() {
    if (this._phaserBGM) {
      try { this._phaserBGM.stop(); } catch(e) {}
      try { this._phaserBGM.destroy(); } catch(e) {}
      this._phaserBGM = null;
    }
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) { this.stopBGM(); }
    else { this.startBGM(); }
    return this.muted;
  }
}
const SFX = new SoundManager();

// ══════════════════════════════════════════════════════════════════
//  SCENE: BOOT
// ══════════════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const W = 800, H = 450;
    // Loading screen background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d2b, 0x0d0d2b, 0x1a0a3a, 0x1a0a3a, 1);
    bg.fillRect(0, 0, W, H);
    // Stars
    for (let i = 0; i < 100; i++) {
      bg.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
      bg.fillRect(Math.random() * W, Math.random() * H * 0.8, 1, 1);
    }
    // Title
    this.add.text(W / 2, H / 2 - 80, 'PIXEL', {
      fontSize: '56px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#a05000', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 20, 'PLATFORMER', {
      fontSize: '32px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#004466', strokeThickness: 5
    }).setOrigin(0.5);
    // Progress bar container
    const barBg = this.add.graphics();
    barBg.fillStyle(0x111133).fillRoundedRect(W/2 - 180, H/2 + 50, 360, 24, 12);
    barBg.lineStyle(2, 0x4444aa).strokeRoundedRect(W/2 - 180, H/2 + 50, 360, 24, 12);
    const bar = this.add.graphics();
    this.load.on('progress', v => {
      bar.clear();
      bar.fillStyle(0x22ddaa);
      bar.fillRoundedRect(W/2 - 178, H/2 + 52, 356 * v, 20, 10);
      // Glow effect on bar
      bar.fillStyle(0xaaffee, 0.3);
      bar.fillRoundedRect(W/2 - 178, H/2 + 52, 356 * v, 8, 6);
    });
    this.add.text(W / 2, H / 2 + 90, 'Memuat aset...', {
      fontSize: '14px', fill: '#88aacc', fontFamily: 'Courier New'
    }).setOrigin(0.5);
