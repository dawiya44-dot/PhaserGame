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
