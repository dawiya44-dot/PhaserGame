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
    // Load assets
    this.load.spritesheet('idle',  'Assets/image/Player/Player_Idle.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('walk',  'Assets/image/Player/Player_walk.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('run',   'Assets/image/Player/Player_run.png',   { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('jump',  'Assets/image/Player/Player_jump.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('climb', 'Assets/image/Player/Player_climb.png', { frameWidth: 32, frameHeight: 40 });
    this.load.audio('bgm', 'backsound.mp3');
  }
  create() { this.scene.start('Menu'); }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: MENU
// ══════════════════════════════════════════════════════════════════
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    const W = this.scale.width, H = this.scale.height;

    // Deep space gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050518, 0x050518, 0x0d1a3a, 0x0d1a3a, 1);
    bg.fillRect(0, 0, W, H);

    // Animated stars (many layers)
    this._stars = [];
    for (let i = 0; i < 120; i++) {
      const s = this.add.graphics();
      const x = Math.random() * W, y = Math.random() * H * 0.75;
      const size = Math.random() < 0.15 ? 2 : 1;
      const alpha = Math.random() * 0.6 + 0.4;
      s.fillStyle(0xffffff, alpha);
      s.fillRect(x, y, size, size);
      this._stars.push({ gfx: s, x, y, baseAlpha: alpha, phase: Math.random() * Math.PI * 2 });
    }

    // Nebula glow blobs
    const nebula = this.add.graphics();
    nebula.fillStyle(0x220044, 0.18); nebula.fillEllipse(150, 120, 280, 160);
    nebula.fillStyle(0x002244, 0.15); nebula.fillEllipse(650, 80, 220, 130);
    nebula.fillStyle(0x001133, 0.12); nebula.fillEllipse(400, 200, 350, 120);

    // Ground strip
    const ground = this.add.graphics();
    ground.fillGradientStyle(0x1a4a1a, 0x1a4a1a, 0x0d2a0d, 0x0d2a0d, 1);
    ground.fillRect(0, H - 70, W, 70);
    ground.fillStyle(0x3aaa3a); ground.fillRect(0, H - 70, W, 8);
    ground.fillStyle(0x2a8a2a, 0.5); ground.fillRect(0, H - 62, W, 4);
    // Grass tufts
    ground.fillStyle(0x4acc4a);
    for (let i = 0; i < W; i += 12) {
      ground.fillRect(i + 2, H - 73, 3, 5);
      ground.fillRect(i + 6, H - 75, 2, 7);
    }

    // Decorative trees on ground
    const deco = this.add.graphics();
    [[60, H-70],[180,H-70],[320,H-70],[500,H-70],[640,H-70],[760,H-70]].forEach(([x,y]) => {
      deco.fillStyle(0x6b3a1a); deco.fillRect(x+10, y-30, 6, 30);
      deco.fillStyle(0x1e7a14); deco.fillCircle(x+13, y-38, 16);
      deco.fillStyle(0x28a01e); deco.fillCircle(x+10, y-42, 11);
      deco.fillStyle(0x50cc40); deco.fillCircle(x+8, y-46, 6);
    });

    // Title with glow effect
    // Shadow layer
    this.add.text(W/2 + 3, H/2 - 133, 'PIXEL', {
      fontSize: '60px', fill: '#220000', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.6);
    const titlePixel = this.add.text(W/2, H/2 - 136, 'PIXEL', {
      fontSize: '60px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#aa5500', strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(W/2 + 2, H/2 - 77, 'PLATFORMER', {
      fontSize: '38px', fill: '#002244', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);
    const titlePlat = this.add.text(W/2, H/2 - 79, 'PLATFORMER', {
      fontSize: '38px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#004466', strokeThickness: 5
    }).setOrigin(0.5);

    // Subtitle decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0x446688, 0.7);
    line.strokeRect(W/2 - 200, H/2 - 50, 400, 1);

    // Info text
    this.add.text(W/2, H/2 - 20, '🪙 Kumpulkan koin  ·  👾 Hindari musuh  ·  🏁 Capai bendera', {
      fontSize: '13px', fill: '#99ccdd', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 12, '← → Gerak   ↑ / Space Lompat   Shift Lari', {
      fontSize: '12px', fill: '#556688', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    // Start button with glow border
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0d6640); btnBg.fillRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
    btnBg.lineStyle(2, 0x22ffaa, 0.8); btnBg.strokeRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
    btnBg.fillStyle(0x1da56a, 0.4); btnBg.fillRoundedRect(W/2 - 108, H/2 + 57, 216, 20, 8);

    const btn = this.add.text(W/2, H/2 + 80, '▶  MULAI GAME', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#ffe566' });
      btnBg.clear();
      btnBg.fillStyle(0x1a8a55); btnBg.fillRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
      btnBg.lineStyle(3, 0x44ffcc, 1.0); btnBg.strokeRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
      btnBg.fillStyle(0x22cc88, 0.5); btnBg.fillRoundedRect(W/2 - 108, H/2 + 57, 216, 20, 8);
    });
    btn.on('pointerout', () => {
      btn.setStyle({ fill: '#ffffff' });
      btnBg.clear();
      btnBg.fillStyle(0x0d6640); btnBg.fillRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
      btnBg.lineStyle(2, 0x22ffaa, 0.8); btnBg.strokeRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
      btnBg.fillStyle(0x1da56a, 0.4); btnBg.fillRoundedRect(W/2 - 108, H/2 + 57, 216, 20, 8);
    });

    const startGame = () => {
      SFX._init(); SFX._resume();
      this.registry.set('score', 0); this.registry.set('coins', 0);
      this.registry.set('lives', 3); this.registry.set('level', 1);
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('Game'));
    };
    btn.on('pointerdown', startGame);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', startGame);

    // Pulse animation on button
    this.tweens.add({
      targets: [btn, btnBg], scaleX: 1.04, scaleY: 1.04,
      yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut'
    });

    // Title float animation
    this.tweens.add({ targets: titlePixel, y: H/2 - 140, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: titlePlat, y: H/2 - 83, yoyo: true, repeat: -1, duration: 2100, ease: 'Sine.easeInOut' });

    // Version text
    this.add.text(W - 8, H - 8, 'v2.0', {
      fontSize: '10px', fill: '#334455', fontFamily: 'Courier New'
    }).setOrigin(1, 1);

    this.cameras.main.fadeIn(600);

    // Twinkle stars in update
    this._starTime = 0;
  }

  update(time) {
    if (!this._stars) return;
    this._stars.forEach(s => {
      const a = s.baseAlpha * (0.5 + 0.5 * Math.sin(time * 0.002 + s.phase));
      s.gfx.setAlpha(a);
    });
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME
// ══════════════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const WORLD_W = 3200;

    this.score      = this.registry.get('score') ?? 0;
    this.coins      = this.registry.get('coins') ?? 0;
    this.lives      = this.registry.get('lives') ?? 3;
    this.level      = this.registry.get('level') ?? 1;
    if (this.level < 1 || this.level > 5) this.level = 1;
    this.isGameOver   = false;
    this._maxLevel    = 5;
    this._flagReached = false;
    this._falling     = false;
    this.invincible   = false;
    this.invTimer     = 0;

    this.physics.world.setBounds(0, 0, WORLD_W, H);

    // Sky background
    const skyGfx = this.add.graphics();
    const cfg0 = this.getLevelConfig(this.level, H, WORLD_W);
    skyGfx.fillGradientStyle(cfg0.skyTop, cfg0.skyTop, cfg0.skyBot, cfg0.skyBot, 1);
    skyGfx.fillRect(0, 0, WORLD_W, H);

    // Clouds (parallax layer)
    this._clouds = this._buildClouds(WORLD_W, H);

    this.platforms = this.physics.add.staticGroup();
    this.buildLevel(WORLD_W, H);
    this.createAnims();

    const spawnY = H - 64 - 20;
    this.player = this.physics.add.sprite(80, spawnY, 'idle');
    this.player.setCollideWorldBounds(true).setBounce(0).setGravityY(300);
    this.player.setSize(20, 34).setOffset(6, 5);
    this.player.play('anim_idle');
    this.player.setDepth(10);

    // Player shadow
    this._playerShadow = this.add.ellipse(80, H - 64, 28, 8, 0x000000, 0.25).setDepth(9);

    this.enemies   = this.physics.add.group();
    this.spawnEnemies(H, WORLD_W);

    this.coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spawnCoins(H, WORLD_W);

    this._buildFlag(WORLD_W, H);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.enemies,   this.hitEnemy,    null, this);
    this.physics.add.overlap(this.player, this.flagZone,  this.reachFlag,   null, this);

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    this._buildHUD(W, H);

    // Mute button
    this.muteBtn = this.add.text(W - 12, H - 16, '🔊', {
      fontSize: '18px', fontFamily: 'Courier New'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => {
      const m = SFX.toggleMute();
      this.muteBtn.setText(m ? '🔇' : '🔊');
      if (!m) { SFX.setScene(this); SFX.startBGM(); }
    });

    SFX._init();
    SFX._resume();
    SFX.setScene(this);
    SFX.startBGM();
    this.cameras.main.fadeIn(400);
  }

  // ── CLOUDS ───────────────────────────────────────────────────
  _buildClouds(WORLD_W, H) {
    const clouds = [];
    const cloudData = [];
    for (let x = 80; x < WORLD_W; x += Phaser.Math.Between(200, 380)) {
      cloudData.push({ x, y: Phaser.Math.Between(30, H * 0.35), w: Phaser.Math.Between(60, 130), h: Phaser.Math.Between(22, 42) });
    }
    cloudData.forEach(c => {
      const g = this.add.graphics().setScrollFactor(0.15).setDepth(1).setAlpha(0.82);
      g.fillStyle(0xffffff);
      g.fillEllipse(c.x, c.y, c.w, c.h);
      g.fillEllipse(c.x + c.w * 0.22, c.y - c.h * 0.3, c.w * 0.65, c.h * 0.75);
      g.fillEllipse(c.x - c.w * 0.2, c.y + c.h * 0.1, c.w * 0.55, c.h * 0.65);
      g.fillStyle(0xeef8ff, 0.6);
      g.fillEllipse(c.x - c.w * 0.1, c.y - c.h * 0.05, c.w * 0.4, c.h * 0.4);
      clouds.push({ gfx: g, baseX: c.x, speed: 0.008 + Math.random() * 0.006 });
    });
    return clouds;
  }

  // ── FLAG ─────────────────────────────────────────────────────
  _buildFlag(WORLD_W, H) {
    const flagX = WORLD_W - 120;
    this.flagZone = this.add.zone(flagX, H - 130, 50, 120);
    this.physics.world.enable(this.flagZone);
    this.flagZone.body.allowGravity = false;

    const fg = this.add.graphics().setDepth(8);
    // Pole shadow
    fg.fillStyle(0x000000, 0.2); fg.fillRect(flagX + 5, H - 240, 4, 170);
    // Pole
    fg.fillStyle(0xccddee); fg.fillRect(flagX + 2, H - 242, 5, 172);
    fg.fillStyle(0xeef4ff, 0.6); fg.fillRect(flagX + 3, H - 242, 2, 172);
    // Flag colors per level
    const flagColors = [
      [0xff3344, 0xff6677], [0xffaa00, 0xffcc44],
      [0xff6600, 0xff9944], [0x4488ff, 0x88bbff], [0xaa44ff, 0xcc88ff]
    ];
    const [fc, fh] = flagColors[(this.level - 1)] || flagColors[0];
    fg.fillStyle(fc);
    fg.fillTriangle(flagX + 7, H - 242, flagX + 52, H - 220, flagX + 7, H - 198);
    fg.fillStyle(fh, 0.5);
    fg.fillTriangle(flagX + 7, H - 242, flagX + 52, H - 220, flagX + 30, H - 220);
    // Base
    fg.fillStyle(0x888899); fg.fillRect(flagX - 8, H - 72, 26, 8);
    fg.fillStyle(0xaabbcc, 0.5); fg.fillRect(flagX - 6, H - 72, 22, 3);

    this.add.text(flagX + 4, H - 192, `LVL\n${this.level}`, {
      fontSize: '9px', fill: '#fff', fontFamily: 'Courier New', fontStyle: 'bold', align: 'center'
    }).setDepth(9);
  }

  // ── HUD ──────────────────────────────────────────────────────
  _buildHUD(W, H) {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // HUD background panel
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.65); hudBg.fillRect(0, 0, W, 42);
    hudBg.lineStyle(1, 0x334466, 0.8); hudBg.strokeRect(0, 41, W, 1);
    // Subtle gradient shine on HUD
    hudBg.fillStyle(0xffffff, 0.04); hudBg.fillRect(0, 0, W, 12);

    // Score section
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x1a2a44, 0.8); scoreBg.fillRoundedRect(6, 6, 160, 30, 6);
    scoreBg.lineStyle(1, 0x3355aa, 0.6); scoreBg.strokeRoundedRect(6, 6, 160, 30, 6);

    this.scoreText = this.add.text(16, 13, 'SCORE: ' + this.score, {
      fontSize: '13px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold'
    });

    // Coins section
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x2a1a00, 0.8); coinBg.fillRoundedRect(174, 6, 90, 30, 6);
    coinBg.lineStyle(1, 0xaa7700, 0.6); coinBg.strokeRoundedRect(174, 6, 90, 30, 6);

    this.coinText = this.add.text(184, 13, '🪙 ' + this.coins, {
      fontSize: '13px', fill: '#f0c020', fontFamily: 'Courier New', fontStyle: 'bold'
    });

    // Lives section (center)
    const livesBg = this.add.graphics();
    livesBg.fillStyle(0x2a0a0a, 0.8); livesBg.fillRoundedRect(W/2 - 55, 6, 110, 30, 6);
    livesBg.lineStyle(1, 0xaa2233, 0.6); livesBg.strokeRoundedRect(W/2 - 55, 6, 110, 30, 6);

    this.livesText = this.add.text(W/2, 13, '', {
      fontSize: '14px', fill: '#ff4466', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.updateHeartsHUD();

    // Level badge (right)
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0x0a1a2a, 0.8); lvlBg.fillRoundedRect(W - 86, 6, 80, 30, 6);
    lvlBg.lineStyle(1, 0x2288cc, 0.6); lvlBg.strokeRoundedRect(W - 86, 6, 80, 30, 6);

    this.levelText = this.add.text(W - 46, 13, 'LVL ' + this.level, {
      fontSize: '13px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Controls hint (bottom)
    const ctrlText = this.add.text(W/2, H - 10, '← → Gerak   ↑/Space Lompat   Shift Lari', {
      fontSize: '10px', fill: 'rgba(150,180,220,0.45)', fontFamily: 'Courier New'
    }).setOrigin(0.5, 1);

    this.hud.add([hudBg, scoreBg, this.scoreText, coinBg, this.coinText,
                  livesBg, this.livesText, lvlBg, this.levelText, ctrlText]);
  }

  // ── LEVEL CONFIG ─────────────────────────────────────────────
  getLevelConfig(lvl, H, WORLD_W) {
    const groundY = H - 64;
    const configs = {
      1: {
        skyTop:0x5ba3d9, skyBot:0xb8e4f9,
        platColor:0x5ac85a, platTop:0x6ee86e, platDirt:0x8b6733, platShadow:0x3a8a3a,
        brickC:0xcc7744, brickD:0x994422, grassTufts:true,
        grounds:[[0,900],[1000,350],[1400,300],[1750,400],[2200,300],[2550,400],[3000,200]],
        floats:[[300,groundY-100,128,20],[500,groundY-160,96,20],[700,groundY-120,128,20],[1100,groundY-130,96,20],[1500,groundY-110,112,20],[1900,groundY-150,96,20],[2300,groundY-120,128,20],[2700,groundY-110,96,20]],
        bricks:[[450,groundY-80,64,20],[950,groundY-130,64,20],[1600,groundY-100,64,20],[2100,groundY-120,64,20]],
        enemies:[650,950,1200,1500,1900,2300],
        coins:[200,350,520,680,800,1050,1300,1550,1800,2100,2400,2700],
        trees:[120,400,680,1100,1600,2000,2500], bushes:[250,500,760,1250,1750,2250,2750],
      },
      2: {
        skyTop:0xd4a843, skyBot:0xf5d88a,
        platColor:0xd4a843, platTop:0xeec050, platDirt:0xa06820, platShadow:0x9a7020,
        brickC:0xbb8833, brickD:0x996622, grassTufts:false,
        grounds:[[0,800],[920,500],[1450,400],[1880,450],[2360,400],[2790,410]],
        floats:[[300,groundY-110,128,20],[600,groundY-170,96,20],[980,groundY-130,112,20],[1350,groundY-150,96,20],[1780,groundY-120,128,20],[2150,groundY-160,80,20],[2550,groundY-140,96,20],[2950,groundY-110,112,20]],
        bricks:[[480,groundY-90,64,20],[1100,groundY-130,64,20],[1900,groundY-100,64,20],[2400,groundY-120,64,20]],
        enemies:[650,1000,1400,1800,2200,2600],
        coins:[200,420,650,900,1150,1450,1700,1950,2250,2650,2950],
        trees:[130,520,980,1500,1900,2400,2800], bushes:[300,680,1100,1600,2050,2500],
      },
      3: {
        skyTop:0x1a0500, skyBot:0x4a1500,
        platColor:0x8b3a00, platTop:0xcc5500, platDirt:0x661100, platShadow:0x551100,
        brickC:0xaa3300, brickD:0x882200, grassTufts:false,
        grounds:[[0,750],[870,450],[1350,380],[1760,440],[2230,380],[2640,360],[3020,180]],
        floats:[[280,groundY-120,96,20],[550,groundY-180,80,20],[920,groundY-140,112,20],[1300,groundY-160,96,20],[1700,groundY-130,80,20],[2100,groundY-170,96,20],[2500,groundY-150,80,20],[2850,groundY-120,96,20]],
        bricks:[[420,groundY-100,64,20],[1000,groundY-140,64,20],[1800,groundY-110,64,20],[2300,groundY-130,64,20]],
        enemies:[600,950,1300,1700,2100,2500,2800],
        coins:[190,400,600,850,1100,1400,1650,1950,2280,2680,2950],
        trees:[], bushes:[],
      },
      4: {
        skyTop:0x8ab4d8, skyBot:0xd8eeff,
        platColor:0xa0c8f0, platTop:0xddeeff, platDirt:0x6090c0, platShadow:0x5080a0,
        brickC:0x88aacc, brickD:0x6688aa, grassTufts:true,
        grounds:[[0,700],[820,450],[1300,400],[1730,420],[2190,400],[2630,370]],
        floats:[[260,groundY-130,96,20],[500,groundY-190,80,20],[870,groundY-150,112,20],[1260,groundY-170,96,20],[1660,groundY-140,80,20],[2060,groundY-180,96,20],[2460,groundY-160,80,20],[2810,groundY-130,96,20]],
        bricks:[[400,groundY-110,64,20],[970,groundY-150,64,20],[1770,groundY-120,64,20],[2280,groundY-140,64,20]],
        enemies:[550,900,1200,1600,2000,2400,2700],
        coins:[170,380,580,810,1060,1360,1610,1890,2220,2640,2920],
        trees:[110,430,870,1320,1760,2240,2660], bushes:[],
      },
      5: {
        skyTop:0x020010, skyBot:0x0a0030,
        platColor:0x6633aa, platTop:0xaa66ff, platDirt:0x441188, platShadow:0x331077,
        brickC:0x9933cc, brickD:0x661199, grassTufts:false,
        grounds:[[0,650],[780,400],[1210,360],[1600,380],[2010,360],[2410,340],[2790,210]],
        floats:[[240,groundY-140,80,20],[460,groundY-200,64,20],[820,groundY-160,96,20],[1160,groundY-180,80,20],[1550,groundY-150,64,20],[1900,groundY-190,80,20],[2280,groundY-170,64,20],[2660,groundY-140,80,20],[2960,groundY-160,64,20]],
        bricks:[[380,groundY-120,64,20],[910,groundY-160,64,20],[1700,groundY-130,64,20],[2290,groundY-150,64,20]],
        enemies:[500,830,1150,1560,1960,2360,2710,2980],
        coins:[150,340,530,760,1000,1250,1510,1780,2100,2450,2810],
        trees:[], bushes:[],
      },
    };
    return configs[lvl] || configs[1];
  }

  // ── BUILD LEVEL ──────────────────────────────────────────────
  buildLevel(WORLD_W, H) {
    const cfg = this.getLevelConfig(this.level, H, WORLD_W);
    this._levelCfg = cfg;
    const G = this.add.graphics().setDepth(2);
    const groundY = H - 64;
    this.groundY = groundY;

    const addBody = (x, y, w, h) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0, 0);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.body.setSize(w, h).reset(x, y);
      this.platforms.add(zone);
    };

    const addPlatform = (x, y, w, h) => {
      // Drop shadow
      G.fillStyle(0x000000, 0.18); G.fillRect(x + 4, y + h, w, 6);
      // Main body
      G.fillStyle(cfg.platDirt); G.fillRect(x, y + 6, w, h - 6);
      // Top grass/surface
      G.fillStyle(cfg.platColor); G.fillRect(x, y, w, 8);
      // Highlight on top
      G.fillStyle(cfg.platTop, 0.7); G.fillRect(x + 1, y + 1, w - 2, 3);
      // Side shadow
      G.fillStyle(cfg.platShadow || cfg.platDirt, 0.5); G.fillRect(x, y + 8, 3, h - 8);
      // Dirt texture lines
      G.fillStyle(0x000000, 0.08);
      for (let i = 0; i < Math.floor(w / 16); i++) G.fillRect(x + 4 + i * 16, y + 14, 8, 1);
      for (let i = 0; i < Math.floor(w / 16); i++) G.fillRect(x + 8 + i * 16, y + 22, 6, 1);
      // Grass tufts
      if (cfg.grassTufts) {
        G.fillStyle(cfg.platTop);
        for (let i = 0; i < Math.floor(w / 10); i++) {
          G.fillRect(x + 2 + i * 10, y - 4, 3, 5);
          G.fillRect(x + 5 + i * 10, y - 6, 2, 7);
          G.fillRect(x + 8 + i * 10, y - 3, 2, 4);
        }
      }
      addBody(x, y, w, h);
    };

    const addBrick = (x, y, w, h) => {
      // Shadow
      G.fillStyle(0x000000, 0.2); G.fillRect(x + 3, y + h, w, 5);
      // Base
      G.fillStyle(cfg.brickC); G.fillRect(x, y, w, h);
      // Brick pattern
      G.fillStyle(cfg.brickD, 0.6);
      for (let row = 0; row < h; row += 10) G.fillRect(x, y + row, w, 1);
      for (let col = 0; col < w; col += 16) G.fillRect(x + col, y, 1, h);
      // Highlight
      G.fillStyle(0xffffff, 0.15); G.fillRect(x + 1, y + 1, w - 2, 3);
      // Question mark glow
      G.fillStyle(0xf8d040); G.fillRect(x + w/2 - 5, y + h/2 - 6, 10, 12);
      G.fillStyle(0xffffff, 0.6); G.fillRect(x + w/2 - 3, y + h/2 - 4, 4, 4);
      addBody(x, y, w, h);
    };

    cfg.grounds.forEach(([start, len]) => addPlatform(start, groundY, len, 64));
    cfg.floats.forEach(([x, y, w, h])  => addPlatform(x, y, w, h));
    cfg.bricks.forEach(([x, y, w, h])  => addBrick(x, y, w, h));

    // Decorations
    cfg.trees.forEach(x  => this._drawTree(G, x, groundY));
    cfg.bushes.forEach(x => this._drawBush(G, x, groundY));

    // Ground bottom fill
    G.fillStyle(0x000000, 0.3); G.fillRect(0, H - 4, WORLD_W, 4);
  }

  _drawTree(G, x, groundY) {
    // Trunk shadow
    G.fillStyle(0x000000, 0.15); G.fillRect(x + 15, groundY - 28, 10, 30);
    // Trunk
    G.fillStyle(0x7a4e1a); G.fillRect(x + 12, groundY - 30, 8, 30);
    G.fillStyle(0x9a6a2a, 0.5); G.fillRect(x + 13, groundY - 30, 3, 30);
    // Foliage layers (3 circles for depth)
    G.fillStyle(0x1a5a10); G.fillCircle(x + 16, groundY - 52, 20);
    G.fillStyle(0x2a7a1e); G.fillCircle(x + 13, groundY - 56, 16);
    G.fillStyle(0x3a9a2a); G.fillCircle(x + 11, groundY - 60, 11);
    G.fillStyle(0x55cc40); G.fillCircle(x + 9, groundY - 64, 6);
    // Highlight
    G.fillStyle(0x88ee66, 0.4); G.fillCircle(x + 8, groundY - 62, 5);
  }

  _drawBush(G, x, groundY) {
    G.fillStyle(0x000000, 0.12); G.fillEllipse(x + 16, groundY - 4, 36, 10);
    G.fillStyle(0x145a0e); G.fillCircle(x + 6, groundY - 10, 11);
    G.fillStyle(0x145a0e); G.fillCircle(x + 18, groundY - 12, 13);
    G.fillStyle(0x145a0e); G.fillCircle(x + 30, groundY - 10, 10);
    G.fillStyle(0x1e7a16); G.fillCircle(x + 6, groundY - 11, 9);
    G.fillStyle(0x1e7a16); G.fillCircle(x + 18, groundY - 13, 11);
    G.fillStyle(0x1e7a16); G.fillCircle(x + 30, groundY - 11, 8);
    G.fillStyle(0x44aa30, 0.5); G.fillCircle(x + 14, groundY - 15, 6);
    G.fillStyle(0x44aa30, 0.5); G.fillCircle(x + 24, groundY - 15, 5);
  }

  // ── ANIMATIONS ───────────────────────────────────────────────
  createAnims() {
    const a = this.anims;
    if (!a.exists('anim_idle'))
      a.create({ key:'anim_idle', frames: a.generateFrameNumbers('idle', {start:0,end:3}), frameRate:6,  repeat:-1 });
    if (!a.exists('anim_walk'))
      a.create({ key:'anim_walk', frames: a.generateFrameNumbers('walk', {start:0,end:7}), frameRate:10, repeat:-1 });
    if (!a.exists('anim_run'))
      a.create({ key:'anim_run',  frames: a.generateFrameNumbers('run',  {start:0,end:7}), frameRate:14, repeat:-1 });
    if (!a.exists('anim_jump'))
      a.create({ key:'anim_jump', frames: a.generateFrameNumbers('jump', {start:0,end:0}), frameRate:1,  repeat:0  });
  }

  // ── SPAWN ENEMIES ────────────────────────────────────────────
  spawnEnemies(H, WORLD_W) {
    const cfg = this._levelCfg;
    const positions = cfg ? cfg.enemies : [600, 900, 1200];
    const speed = 80 + (this.level - 1) * 22;

    positions.forEach(x => {
      const key = 'enemy_' + x + '_' + this.level;
      if (!this.textures.exists(key)) {
        const gfx = this.add.graphics();
        // Body shadow
        gfx.fillStyle(0x000000, 0.25); gfx.fillEllipse(16, 34, 28, 8);
        // Body
        gfx.fillStyle(0xcc2233); gfx.fillRoundedRect(2, 8, 26, 20, 5);
        // Head
        gfx.fillStyle(0xdd3344); gfx.fillRoundedRect(4, 0, 22, 14, 6);
        // Horns
        gfx.fillStyle(0xaa1122);
        gfx.fillTriangle(5, 4, 2, -4, 9, 2);
        gfx.fillTriangle(25, 4, 28, -4, 21, 2);
        // Eyes (white)
        gfx.fillStyle(0xffffff); gfx.fillEllipse(10, 6, 8, 8);
        gfx.fillStyle(0xffffff); gfx.fillEllipse(20, 6, 8, 8);
        // Pupils (angry slant)
        gfx.fillStyle(0x110022); gfx.fillEllipse(11, 7, 4, 5);
        gfx.fillStyle(0x110022); gfx.fillEllipse(21, 7, 4, 5);
        // Eyebrow (angry)
        gfx.fillStyle(0x880011);
        gfx.fillRect(7, 2, 6, 2);
        gfx.fillRect(17, 2, 6, 2);
        // Mouth
        gfx.fillStyle(0x880011); gfx.fillRect(9, 11, 12, 2);
        gfx.fillStyle(0xffffff); gfx.fillRect(10, 11, 2, 2); gfx.fillRect(18, 11, 2, 2);
        // Feet
        gfx.fillStyle(0xaa1122); gfx.fillRoundedRect(3, 26, 10, 8, 3);
        gfx.fillStyle(0xaa1122); gfx.fillRoundedRect(17, 26, 10, 8, 3);
        // Highlight
        gfx.fillStyle(0xff6677, 0.4); gfx.fillEllipse(12, 4, 10, 5);
        gfx.generateTexture(key, 30, 34);
        gfx.destroy();
      }
      const e = this.physics.add.sprite(x, this.groundY - 34, key);
      e.setCollideWorldBounds(true).setBounce(0).setVelocityX(-speed).setGravityY(300);
      e.alive = true;
      e.setDepth(6);
      this.enemies.add(e);
    });
  }

  // ── SPAWN COINS ──────────────────────────────────────────────
  spawnCoins(H, WORLD_W) {
    const cfg    = this._levelCfg;
    const coinXs = cfg ? cfg.coins : [200, 330, 510];

    if (!this.textures.exists('coin_tex')) {
      const cg = this.add.graphics();
      // Outer glow ring
      cg.fillStyle(0xffaa00, 0.3); cg.fillCircle(12, 12, 12);
      // Main coin
      cg.fillStyle(0xcc8800); cg.fillCircle(12, 12, 10);
      cg.fillStyle(0xffcc00); cg.fillCircle(12, 12, 9);
      cg.fillStyle(0xffe566); cg.fillCircle(12, 12, 7);
      // Inner detail
      cg.fillStyle(0xfff0a0); cg.fillCircle(10, 10, 3);
      cg.fillStyle(0xffffff, 0.5); cg.fillCircle(9, 9, 2);
      // Edge ring
      cg.lineStyle(1.5, 0xaa6600, 0.8); cg.strokeCircle(12, 12, 9);
      cg.generateTexture('coin_tex', 24, 24);
      cg.destroy();
    }

    coinXs.forEach(x => {
      const coin = this.coinGroup.create(x, this.groundY - 75, 'coin_tex');
      coin.setDepth(4);
      coin.body.allowGravity = false;
      coin.body.immovable    = true;
      coin.refreshBody();
      // Floating animation
      this.tweens.add({
        targets: coin, y: this.groundY - 82, yoyo: true, repeat: -1,
        duration: 800 + Math.random() * 400, ease: 'Sine.easeInOut',
        delay: Math.random() * 600
      });
    });
  }

  // ── COLLECT COIN ─────────────────────────────────────────────
  collectCoin(player, coin) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    coin.body.enable = false;
    this.coins++;
    this.score += 100;
    this.scoreText.setText('SCORE: ' + this.score);
    this.coinText.setText('🪙 ' + this.coins);
    this._spawnCoinParticles(coin.x, coin.y);
    this.showFloatText(player.x, player.y - 24, '+100', '#ffd700');
    SFX.coin();
  }

  _spawnCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.graphics().setDepth(50);
      const angle = (i / 8) * Math.PI * 2;
      const dist  = Phaser.Math.Between(18, 36);
      p.fillStyle(0xffd700); p.fillCircle(0, 0, Phaser.Math.Between(2, 4));
      p.setPosition(x, y);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 20,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
    // Flash ring
    const ring = this.add.graphics().setDepth(50);
    ring.lineStyle(2, 0xffee44, 1); ring.strokeCircle(x, y, 4);
    this.tweens.add({
      targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 300,
      onComplete: () => ring.destroy()
    });
  }

  // ── HIT ENEMY ────────────────────────────────────────────────
  hitEnemy(player, enemy) {
    if (this.invincible || !enemy.alive) return;

    if (player.body.velocity.y > 0 && player.y < enemy.y - 5) {
      enemy.alive = false;
      // Squish effect before destroy
      this.tweens.add({
        targets: enemy, scaleX: 1.8, scaleY: 0.3, alpha: 0, duration: 200,
        onComplete: () => enemy.destroy()
      });
      player.setVelocityY(-380);
      this.score += 200;
      this.scoreText.setText('SCORE: ' + this.score);
      this._spawnStompParticles(enemy.x, enemy.y);
      this.showFloatText(player.x, player.y - 24, 'STOMP! +200', '#ff8866');
      SFX.stomp();
      return;
    }

    this.lives--;
    this.invincible = true;
    this.invTimer   = 0;
    this.updateHeartsHUD();
    player.setVelocityY(-300);
    // Screen shake
    this.cameras.main.shake(200, 0.008);
    this.tweens.add({
      targets: player, alpha: 0.25, yoyo: true, repeat: 6, duration: 80,
      onComplete: () => player.setAlpha(1)
    });
    this.showFloatText(player.x, player.y - 24, 'OUCH!', '#ff4466');
    SFX.ouch();

    if (this.lives <= 0) {
      SFX.stopBGM(); SFX.gameOver();
      this.time.delayedCall(500, () =>
        this.scene.start('GameOver', { score: this.score, coins: this.coins })
      );
    }
  }

  _spawnStompParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      const p = this.add.graphics().setDepth(50);
      p.fillStyle([0xff4444, 0xff8844, 0xffcc44][i % 3]);
      p.fillRect(0, 0, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7));
      p.setPosition(x, y);
      const vx = Phaser.Math.Between(-60, 60), vy = Phaser.Math.Between(-80, -20);
      this.tweens.add({
        targets: p, x: x + vx * 0.5, y: y + vy * 0.5, alpha: 0,
        duration: 350 + Math.random() * 200, ease: 'Power1',
        onComplete: () => p.destroy()
      });
    }
  }

  // ── REACH FLAG ───────────────────────────────────────────────
  reachFlag(player, flag) {
    if (this._flagReached) return;
    this._flagReached = true;
    player.setVelocityX(0);
    this.score += 1000 + this.coins * 50;
    this.scoreText.setText('SCORE: ' + this.score);
    this.cameras.main.flash(600, 255, 255, 180);
    SFX.stopBGM();

    if (this.level >= this._maxLevel) {
      this.showFloatText(player.x, player.y - 50, '🏆 GAME CLEAR! 🏆', '#ffe566');
      SFX.gameClear();
      this.registry.set('score', this.score); this.registry.set('coins', this.coins);
      this.registry.set('lives', this.lives); this.registry.set('level', 1);
      this.time.delayedCall(2500, () =>
        this.scene.start('GameClear', { score: this.score, coins: this.coins })
      );
    } else {
      const nextLevel = this.level + 1;
      this.showFloatText(player.x, player.y - 50, `LEVEL ${nextLevel}! 🎉`, '#ffe566');
      SFX.levelClear();
      this.registry.set('score', this.score); this.registry.set('coins', this.coins);
      this.registry.set('lives', this.lives); this.registry.set('level', nextLevel);
      this.time.delayedCall(2000, () => this.scene.restart());
    }
  }

  // ── HUD HELPERS ──────────────────────────────────────────────
  updateHeartsHUD() {
    const h = Array.from({ length: 3 }, (_, i) => i < this.lives ? '❤' : '🖤').join(' ');
    this.livesText.setText(h);
  }

  showFloatText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontSize: '15px', fill: color, fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200).setScrollFactor(1);
    this.tweens.add({
      targets: t, y: y - 60, alpha: 0, duration: 1000, ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }

  // ── UPDATE ───────────────────────────────────────────────────
  update(time, delta) {
    if (this.isGameOver || !this.player) return;

    const p        = this.player;
    const cur      = this.cursors;
    const wasd     = this.wasd;
    const onGround = p.body.blocked.down;

    const left      = cur.left.isDown  || wasd.left.isDown;
    const right     = cur.right.isDown || wasd.right.isDown;
    const jump      = Phaser.Input.Keyboard.JustDown(cur.up)    ||
                      Phaser.Input.Keyboard.JustDown(cur.space)  ||
                      Phaser.Input.Keyboard.JustDown(wasd.up);
    const isRunning = wasd.shift.isDown || cur.shift.isDown;
    const speed     = isRunning ? 220 : 140;

    if (left) {
      p.setVelocityX(-speed); p.setFlipX(true);
    } else if (right) {
      p.setVelocityX(speed);  p.setFlipX(false);
    } else {
      p.setVelocityX(0);
    }

    if (jump && onGround) {
      p.setVelocityY(-520);
      SFX.jump();
      this._spawnDustParticles(p.x, p.y + 16);
    }

    // Landing dust
    if (onGround && !this._wasOnGround && Math.abs(p.body.velocity.x) > 10) {
      this._spawnDustParticles(p.x, p.y + 16);
    }
    this._wasOnGround = onGround;

    if (!onGround) {
      p.play('anim_jump', true);
    } else if (left || right) {
      p.play(isRunning ? 'anim_run' : 'anim_walk', true);
    } else {
      p.play('anim_idle', true);
    }

    // Player shadow follows player
    if (this._playerShadow) {
      this._playerShadow.setPosition(p.x, this.groundY + 2);
      const dist = Math.max(0, 1 - (this.groundY - p.y) / 200);
      this._playerShadow.setScale(dist, 1).setAlpha(0.25 * dist);
    }

    // Enemy AI
    this.enemies.getChildren().forEach(e => {
      if (!e.alive || !e.body) return;
      if (e.body.blocked.right) e.setVelocityX(-(80 + (this.level - 1) * 22));
      if (e.body.blocked.left)  e.setVelocityX(  80 + (this.level - 1) * 22);
    });

    // Invincibility timer
    if (this.invincible) {
      this.invTimer += delta;
      if (this.invTimer > 1500) { this.invincible = false; this.invTimer = 0; }
    }

    // Fall off world
    if (p.y > this.scale.height + 50 && !this._falling && !this._flagReached) {
      this._falling = true;
      this.lives--;
      this.updateHeartsHUD();
      this.cameras.main.shake(300, 0.012);
      if (this.lives <= 0) {
        SFX.stopBGM(); SFX.gameOver();
        this.time.delayedCall(300, () =>
          this.scene.start('GameOver', { score: this.score, coins: this.coins })
        );
      } else {
        this.time.delayedCall(400, () => {
          p.setPosition(80, this.groundY - 40).setVelocity(0, 0);
          this.invincible = true; this.invTimer = 0; this._falling = false;
        });
      }
    }
  }

  _spawnDustParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.graphics().setDepth(8);
      p.fillStyle(0xddccaa, 0.7);
      p.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      p.setPosition(x + Phaser.Math.Between(-10, 10), y);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-20, 20),
        y: p.y - Phaser.Math.Between(5, 15),
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: 300 + Math.random() * 150,
        onComplete: () => p.destroy()
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME OVER
// ══════════════════════════════════════════════════════════════════
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(data) { this.finalScore = data.score || 0; this.finalCoins = data.coins || 0; }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Dark overlay with vignette feel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0010, 0x0a0010, 0x1a0005, 0x1a0005, 1);
    bg.fillRect(0, 0, W, H);

    // Scanlines effect
    for (let y = 0; y < H; y += 4) {
      bg.fillStyle(0x000000, 0.08); bg.fillRect(0, y, W, 2);
    }

    // Red glow behind title
    const glow = this.add.graphics();
    glow.fillStyle(0xff0022, 0.08); glow.fillEllipse(W/2, H/2 - 80, 500, 200);

    // Title
    this.add.text(W/2 + 4, H/2 - 116, 'GAME OVER', {
      fontSize: '52px', fill: '#440011', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    const title = this.add.text(W/2, H/2 - 120, 'GAME OVER', {
      fontSize: '52px', fill: '#ff2244', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#880022', strokeThickness: 6
    }).setOrigin(0.5);

    // Flicker animation on title
    this.tweens.add({
      targets: title, alpha: 0.7, yoyo: true, repeat: -1, duration: 150,
      ease: 'Stepped', easeParams: [2]
    });

    // Score panel
    const panel = this.add.graphics();
    panel.fillStyle(0x110022, 0.9); panel.fillRoundedRect(W/2 - 160, H/2 - 60, 320, 90, 12);
    panel.lineStyle(2, 0x660033, 0.8); panel.strokeRoundedRect(W/2 - 160, H/2 - 60, 320, 90, 12);
    panel.fillStyle(0xffffff, 0.03); panel.fillRoundedRect(W/2 - 158, H/2 - 58, 316, 30, 10);

    this.add.text(W/2, H/2 - 38, `Skor Akhir: ${this.finalScore}`, {
      fontSize: '20px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 - 8, `Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '16px', fill: '#f0c020', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Retry button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x880011); btnBg.fillRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
    btnBg.lineStyle(2, 0xff4455, 0.8); btnBg.strokeRoundedRect(W/2 - 110, H/2 + 55, 220, 50, 10);
    btnBg.fillStyle(0xff2233, 0.3); btnBg.fillRoundedRect(W/2 - 108, H/2 + 57, 216, 20, 8);

    const retry = this.add.text(W/2, H/2 + 80, '↺  COBA LAGI', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => { retry.setStyle({ fill: '#ffe566' }); });
    retry.on('pointerout',  () => { retry.setStyle({ fill: '#ffffff' }); });
    retry.on('pointerdown', () => {
      this.registry.set('score', 0); this.registry.set('coins', 0);
      this.registry.set('lives', 3); this.registry.set('level', 1);
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('Menu'));
    });

    this.tweens.add({ targets: [retry, btnBg], scaleX: 1.04, scaleY: 1.04, yoyo: true, repeat: -1, duration: 700 });
    this.cameras.main.fadeIn(500);
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME CLEAR
// ══════════════════════════════════════════════════════════════════
class GameClearScene extends Phaser.Scene {
  constructor() { super('GameClear'); }
  init(data) { this.finalScore = data.score || 0; this.finalCoins = data.coins || 0; }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Deep space background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x020010, 0x020010, 0x0a0030, 0x0a0030, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 150; i++) {
      const size = Math.random() < 0.1 ? 2 : 1;
      bg.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      bg.fillRect(Math.random() * W, Math.random() * H, size, size);
    }

    // Nebula
    bg.fillStyle(0x220055, 0.2); bg.fillEllipse(W * 0.3, H * 0.4, 300, 180);
    bg.fillStyle(0x002255, 0.15); bg.fillEllipse(W * 0.7, H * 0.5, 250, 150);

    // Trophy glow
    const trophyGlow = this.add.graphics();
    trophyGlow.fillStyle(0xffcc00, 0.1); trophyGlow.fillCircle(W/2, H/2 - 80, 80);

    this.add.text(W/2, H/2 - 110, '🏆', { fontSize: '72px' }).setOrigin(0.5);

    // Title
    this.add.text(W/2 + 3, H/2 - 43, 'GAME CLEAR!', {
      fontSize: '44px', fill: '#220000', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    const title = this.add.text(W/2, H/2 - 46, 'GAME CLEAR!', {
      fontSize: '44px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#aa7700', strokeThickness: 6
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: H/2 - 50, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });

    this.add.text(W/2, H/2 + 2, 'Selamat! Semua 5 level selesai!', {
      fontSize: '14px', fill: '#99ccdd', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Score panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a22, 0.9); panel.fillRoundedRect(W/2 - 160, H/2 + 20, 320, 80, 12);
    panel.lineStyle(2, 0x4455aa, 0.8); panel.strokeRoundedRect(W/2 - 160, H/2 + 20, 320, 80, 12);
    panel.fillStyle(0xffffff, 0.04); panel.fillRoundedRect(W/2 - 158, H/2 + 22, 316, 25, 10);

    this.add.text(W/2, H/2 + 40, `Skor Akhir: ${this.finalScore}`, {
      fontSize: '20px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 66, `Total Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '15px', fill: '#f0c020', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Play again button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0d6640); btnBg.fillRoundedRect(W/2 - 110, H/2 + 120, 220, 50, 10);
    btnBg.lineStyle(2, 0x22ffaa, 0.8); btnBg.strokeRoundedRect(W/2 - 110, H/2 + 120, 220, 50, 10);
    btnBg.fillStyle(0x1da56a, 0.4); btnBg.fillRoundedRect(W/2 - 108, H/2 + 122, 216, 20, 8);

    const retry = this.add.text(W/2, H/2 + 145, '↩  MAIN LAGI', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setStyle({ fill: '#ffe566' }));
    retry.on('pointerout',  () => retry.setStyle({ fill: '#ffffff' }));
    retry.on('pointerdown', () => {
      this.registry.set('score', 0); this.registry.set('coins', 0);
      this.registry.set('lives', 3); this.registry.set('level', 1);
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('Menu'));
    });
    this.tweens.add({ targets: [retry, btnBg], scaleX: 1.04, scaleY: 1.04, yoyo: true, repeat: -1, duration: 800 });

    // Fireworks
    this.time.addEvent({
      delay: 350, repeat: 25,
      callback: () => {
        const fx = this.add.graphics().setDepth(20);
        const cx = Phaser.Math.Between(80, W - 80);
        const cy = Phaser.Math.Between(40, H * 0.55);
        const color = [0xff4466, 0xffe566, 0x44ffaa, 0x4488ff, 0xff8800, 0xcc44ff][Phaser.Math.Between(0, 5)];
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          fx.fillStyle(color); fx.fillCircle(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28, 3);
          fx.fillStyle(0xffffff, 0.6); fx.fillCircle(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 2);
        }
        fx.fillStyle(0xffffff); fx.fillCircle(cx, cy, 4);
        this.tweens.add({ targets: fx, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 700, onComplete: () => fx.destroy() });
      }
    });

    this.cameras.main.fadeIn(700);
  }
}

// ══════════════════════════════════════════════════════════════════
//  PHASER CONFIG
// ══════════════════════════════════════════════════════════════════
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#050518',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, GameClearScene]
};

new Phaser.Game(config);
