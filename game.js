// ══════════════════════════════════════════════════════════════════
//  PIXEL PLATFORMER — game.js
//  Sound: Web Audio API procedural (no external audio files)
//  BGM: proper lookahead scheduler (tidak pakai setInterval)
// ══════════════════════════════════════════════════════════════════

// ─── SOUND MANAGER ───────────────────────────────────────────────
class SoundManager {
  constructor() {
    this.ctx          = null;
    this.master       = null;
    this.muted        = false;
    // BGM — dihandle Phaser sound (set via setScene)
    this._phaserBGM   = null;  // Phaser.Sound.WebAudioSound instance
  }

  // ── lazy init (harus dipanggil setelah user gesture) ──
  _init() {
    if (this.ctx) return;
    this.ctx    = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ── low-level helpers ──
  _osc(freq, type, start, dur, vol, freqEnd) {
    if (!this.ctx) return;
    const g   = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    osc.type  = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd !== undefined)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  _noise(start, dur, vol) {
    if (!this.ctx) return;
    const n   = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(g);
    g.connect(this.master);
    src.start(start);
  }

  // ── SFX ──────────────────────────────────────────────────────
  coin() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(880,  'sine', t,       0.07, 0.35);
    this._osc(1320, 'sine', t+0.06,  0.10, 0.30);
    this._osc(1760, 'sine', t+0.13,  0.09, 0.25);
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
    this._osc(220, 'sine',   t, 0.08, 0.18);
  }

  ouch() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(300, 'sawtooth', t, 0.28, 0.30, 75);
  }

  levelClear() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) =>
      this._osc(f, 'sine', t + i * 0.13, 0.18, 0.32)
    );
  }

  gameClear() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319, 1047, 784, 1319, 1047].forEach((f, i) =>
      this._osc(f, 'sine', t + i * 0.12, 0.20, 0.28)
    );
    this._osc(523, 'triangle', t + 1.1, 0.5, 0.15);
  }

  gameOver() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [440, 370, 311, 220].forEach((f, i) =>
      this._osc(f, 'sawtooth', t + i * 0.22, 0.28, 0.24)
    );
  }

  // ── BGM — pakai Phaser sound (MP3 file) ─────────────────────
  // Phaser scene harus di-set dulu via setScene() sebelum startBGM.

  setScene(scene) {
    this._scene = scene;
  }

  startBGM() {
    this.stopBGM();
    if (this.muted || !this._scene) return;
    if (!this._scene.cache.audio.exists('bgm')) return;

    this._phaserBGM = this._scene.sound.add('bgm', {
      loop:   true,
      volume: 0.5
    });
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
    if (this.muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.muted;
  }
}

// ── Singleton global ──
const SFX = new SoundManager();

// ══════════════════════════════════════════════════════════════════
//  SCENE: BOOT
// ══════════════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = this.add.graphics();
    const bg  = this.add.graphics();
    bg.fillStyle(0x222244).fillRect(200, 170, 400, 30);
    this.load.on('progress', v => {
      bar.clear();
      bar.fillStyle(0x22cc88).fillRect(200, 170, 400 * v, 30);
    });
    this.add.text(400, 210, 'Memuat aset...', {
      fontSize: '16px', fill: '#aaddcc', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(400, 130, 'PIXEL PLATFORMER', {
      fontSize: '28px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.load.spritesheet('idle',  'Assets/image/Player/Player_Idle.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('walk',  'Assets/image/Player/Player_walk.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('run',   'Assets/image/Player/Player_run.png',   { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('jump',  'Assets/image/Player/Player_jump.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('climb', 'Assets/image/Player/Player_climb.png', { frameWidth: 32, frameHeight: 40 });
    this.load.image('bg',      'Assets/image/Background/Background.png');
    this.load.image('tileset', 'Assets/image/Tileset/Tileset.png');
    this.load.image('deco',    'Assets/image/16x16 decorations/16 x16 decorations.png');
    // Background music
    this.load.audio('bgm', 'backsaound.mp3');
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

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x0d2a1a, 0x0d2a1a, 1);
    bg.fillRect(0, 0, W, H);

    for (let i = 0; i < 80; i++) {
      bg.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      bg.fillRect(Math.random() * W, Math.random() * H * 0.6,
        Math.random() < 0.5 ? 1 : 2, Math.random() < 0.5 ? 1 : 2);
    }

    bg.fillStyle(0x2d8a1e).fillRect(0, H - 60, W, 10);
    bg.fillStyle(0x8b6733).fillRect(0, H - 50, W, 50);

    this.add.text(W / 2, H / 2 - 120, 'PIXEL', {
      fontSize: '52px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#a05000', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 60, 'PLATFORMER', {
      fontSize: '36px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#004466', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 10,
      'Kumpulkan koin 🪙 · Hindari musuh 👾 · Capai bendera 🏁', {
      fontSize: '13px', fill: '#aaddcc', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 45, '← → Gerak  |  ↑ / Space Lompat  |  Shift Lari', {
      fontSize: '12px', fill: '#667799', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 100, '▶  MULAI GAME', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold',
      backgroundColor: '#1da56a', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffe566' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));

    const startGame = () => {
      // Inisialisasi AudioContext setelah user gesture
      SFX._init();
      SFX._resume();
      this.registry.set('score', 0);
      this.registry.set('coins', 0);
      this.registry.set('lives', 3);
      this.registry.set('level', 1);
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('Game'));
    };

    btn.on('pointerdown', startGame);
    this.tweens.add({
      targets: btn, scaleX: 1.05, scaleY: 1.05,
      yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut'
    });

    const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enter.on('down', startGame);
    this.cameras.main.fadeIn(500);
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME
// ══════════════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const WORLD_W = 3200;

    this.score      = this.registry.get('score') ?? 0;
    this.coins      = this.registry.get('coins') ?? 0;
    this.lives      = this.registry.get('lives') ?? 3;
    this.level      = this.registry.get('level') ?? 1;
    if (this.level < 1 || this.level > 5) this.level = 1;
    this.isGameOver = false;
    this._maxLevel  = 5;

    this.physics.world.setBounds(0, 0, WORLD_W, H);

    this.add.tileSprite(0, 0, WORLD_W, H, 'bg')
      .setOrigin(0, 0).setScrollFactor(0.3);

    this.platforms = this.physics.add.staticGroup();
    this.buildLevel(WORLD_W, H);
    this.createAnims();

    const spawnY = H - 64 - 20;
    this.player = this.physics.add.sprite(80, spawnY, 'idle');
    this.player.setCollideWorldBounds(true).setBounce(0).setGravityY(200);
    this.player.setSize(20, 34).setOffset(6, 5);
    this.player.play('anim_idle');

    this.enemies   = this.physics.add.group();
    this.spawnEnemies(H, WORLD_W);

    this.coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spawnCoins(H, WORLD_W);

    // Flag
    const flagX = WORLD_W - 120;
    this.flagZone = this.add.zone(flagX, H - 130, 40, 100);
    this.physics.world.enable(this.flagZone);
    this.flagZone.body.allowGravity = false;
    const flagGfx = this.add.graphics();
    flagGfx.fillStyle(0xaabbcc).fillRect(flagX, H - 230, 4, 160);
    const flagColors = [0xff3344, 0xffaa00, 0xff6600, 0x4488ff, 0xaa44ff];
    flagGfx.fillStyle(flagColors[this.level - 1] || 0xff3344)
      .fillTriangle(flagX + 4, H - 230, flagX + 44, H - 210, flagX + 4, H - 190);
    this.add.text(flagX + 2, H - 175, `LVL${this.level}`, {
      fontSize: '10px', fill: '#fff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setDepth(10);

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

    // HUD
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.5).fillRect(0, 0, W, 36);
    this.scoreText = this.add.text(12, 8, 'SCORE: ' + this.score, {
      fontSize: '14px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold'
    });
    this.coinText  = this.add.text(200, 8, '🪙 ' + this.coins, {
      fontSize: '14px', fill: '#f0c020', fontFamily: 'Courier New', fontStyle: 'bold'
    });
    this.livesText = this.add.text(W / 2, 8, '❤ ❤ ❤', {
      fontSize: '14px', fill: '#ff4466', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.levelText = this.add.text(W - 80, 8, 'LVL ' + this.level, {
      fontSize: '14px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold'
    });
    const ctrlText = this.add.text(W / 2, H - 16,
      '← → Gerak  ↑/Space Lompat  Shift Lari', {
      fontSize: '11px', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Courier New'
    }).setOrigin(0.5, 1);
    this.hud.add([hudBg, this.scoreText, this.coinText, this.livesText, this.levelText, ctrlText]);

    // Mute button
    this.muteBtn = this.add.text(W - 12, H - 16, '🔊', {
      fontSize: '18px', fontFamily: 'Courier New'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(200)
      .setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => {
      const m = SFX.toggleMute();
      this.muteBtn.setText(m ? '🔇' : '🔊');
      if (!m) { SFX.setScene(this); SFX.startBGM(); }
    });

    this.invincible   = false;
    this.invTimer     = 0;
    this._flagReached = false;
    this._falling     = false;

    // Mulai BGM
    SFX.setScene(this);
    SFX.startBGM();
  }

  // ── LEVEL CONFIG ─────────────────────────────────────────────
  getLevelConfig(lvl, H, WORLD_W) {
    const groundY = H - 64;
    const configs = {
      1: {
        platColor:0x5ac85a, platTop:0x4aaa4a, platDirt:0x8b6733, brickC:0xcc7744, brickD:0x994422,
        grassTufts:true,
        grounds:[[0,900],[1000,350],[1400,300],[1750,400],[2200,300],[2550,400],[3000,200]],
        floats:[[300,groundY-100,128,20],[500,groundY-160,96,20],[700,groundY-120,128,20],[950,groundY-100,96,20],[1150,groundY-180,128,20],[1350,groundY-120,96,20],[1600,groundY-150,128,20],[1800,groundY-100,96,20],[2050,groundY-180,128,20],[2250,groundY-120,96,20],[2500,groundY-160,128,20],[2700,groundY-100,96,20],[2900,groundY-150,128,20]],
        bricks:[[450,groundY-80,64,20],[950,groundY-130,64,20],[1450,groundY-80,64,20],[2050,groundY-130,96,20],[2600,groundY-80,64,20]],
        enemies:[650,950,1200,1500,1780,2050,2350,2650,2950],
        coins:[200,350,520,680,800,1050,1220,1400,1620,1820,2080,2280,2520,2720,2920],
        trees:[120,400,680,1050,1300,1650,1900,2150,2500,2750,2960],
        bushes:[250,500,760,1120,1500,1800,2100,2400,2700],
        bgColor:0x7ec8e3,
      },
      2: {
        platColor:0xd4a843, platTop:0xc89030, platDirt:0xa06820, brickC:0xbb8833, brickD:0x996622,
        grassTufts:false,
        grounds:[[0,700],[800,300],[1150,250],[1450,300],[1800,250],[2100,300],[2450,250],[2750,300],[3100,200],[3400,250]],
        floats:[[250,groundY-110,96,20],[450,groundY-170,80,20],[650,groundY-130,112,20],[900,groundY-110,80,20],[1100,groundY-190,96,20],[1320,groundY-130,80,20],[1550,groundY-160,112,20],[1780,groundY-110,80,20],[2000,groundY-190,96,20],[2200,groundY-130,80,20],[2420,groundY-170,112,20],[2650,groundY-110,80,20],[2880,groundY-160,96,20],[3150,groundY-130,80,20],[3380,groundY-170,96,20]],
        bricks:[[400,groundY-90,64,20],[850,groundY-140,64,20],[1350,groundY-90,64,20],[2000,groundY-140,96,20],[2600,groundY-90,64,20],[3100,groundY-140,64,20],[3380,groundY-90,64,20]],
        enemies:[600,850,1100,1400,1650,1950,2200,2500,2800,3150,3420],
        coins:[180,320,500,660,780,1000,1200,1380,1600,1800,2050,2250,2480,2680,2900,3150,3400],
        trees:[100,360,630,1000,1260,1600,1870,2120,2460,2710,2980,3250],
        bushes:[220,470,740,1100,1480,1780,2080,2380,2680,2980],
        bgColor:0xe8c87a,
      },
      3: {
        platColor:0x8b3a00, platTop:0xaa5500, platDirt:0x661100, brickC:0xaa3300, brickD:0x882200,
        grassTufts:false,
        grounds:[[0,600],[700,250],[1000,200],[1250,250],[1550,200],[1800,250],[2100,200],[2350,250],[2650,200],[2900,250],[3200,150],[3400,200],[3650,150]],
        floats:[[220,groundY-120,80,20],[420,groundY-180,64,20],[620,groundY-140,96,20],[850,groundY-120,64,20],[1050,groundY-200,80,20],[1280,groundY-140,64,20],[1500,groundY-170,96,20],[1730,groundY-120,64,20],[1930,groundY-200,80,20],[2150,groundY-140,64,20],[2380,groundY-180,96,20],[2600,groundY-120,64,20],[2830,groundY-200,80,20],[3050,groundY-140,64,20],[3280,groundY-170,96,20],[3500,groundY-120,64,20]],
        bricks:[[350,groundY-100,64,20],[800,groundY-150,64,20],[1300,groundY-100,64,20],[1850,groundY-150,96,20],[2400,groundY-100,64,20],[2950,groundY-150,64,20],[3350,groundY-100,64,20],[3600,groundY-150,64,20]],
        enemies:[550,800,1050,1320,1580,1850,2120,2400,2700,3000,3300,3580],
        coins:[150,300,480,650,770,980,1170,1360,1570,1770,2020,2220,2460,2660,2880,3080,3320,3560],
        trees:[], bushes:[],
        bgColor:0x330a00,
      },
      4: {
        platColor:0xa0c8f0, platTop:0xffffff, platDirt:0x6090c0, brickC:0x88aacc, brickD:0x6688aa,
        grassTufts:true,
        grounds:[[0,500],[600,200],[850,180],[1080,200],[1330,180],[1560,200],[1810,180],[2040,200],[2290,180],[2520,200],[2770,180],[3000,200],[3250,180],[3480,200],[3730,180],[3960,200]],
        floats:[[200,groundY-130,64,20],[380,groundY-190,48,20],[560,groundY-150,80,20],[780,groundY-130,48,20],[960,groundY-210,64,20],[1160,groundY-150,48,20],[1360,groundY-180,80,20],[1580,groundY-130,48,20],[1760,groundY-210,64,20],[1960,groundY-150,48,20],[2160,groundY-190,80,20],[2360,groundY-130,48,20],[2560,groundY-210,64,20],[2760,groundY-150,48,20],[2960,groundY-190,80,20],[3160,groundY-130,48,20],[3380,groundY-210,64,20],[3580,groundY-150,48,20],[3800,groundY-190,80,20]],
        bricks:[[300,groundY-110,48,20],[700,groundY-160,48,20],[1200,groundY-110,48,20],[1800,groundY-160,64,20],[2400,groundY-110,48,20],[3000,groundY-160,48,20],[3400,groundY-110,48,20],[3800,groundY-160,48,20]],
        enemies:[500,750,1000,1280,1550,1820,2100,2380,2680,2980,3280,3580,3880],
        coins:[130,270,450,620,750,960,1150,1340,1560,1760,2010,2210,2450,2650,2870,3070,3300,3500,3720,3900],
        trees:[80,320,600,880,1160,1440,1720,2000,2280,2560,2840,3120,3400,3680,3920],
        bushes:[],
        bgColor:0xc8e8ff,
      },
      5: {
        platColor:0x6633aa, platTop:0xaa66ff, platDirt:0x441188, brickC:0x9933cc, brickD:0x661199,
        grassTufts:false,
        grounds:[[0,450],[550,180],[780,150],[980,180],[1180,150],[1380,180],[1580,150],[1780,180],[1980,150],[2180,180],[2380,150],[2580,180],[2780,150],[2980,180],[3180,150],[3380,180],[3580,150],[3780,200]],
        floats:[[180,groundY-140,48,20],[350,groundY-200,40,20],[520,groundY-160,64,20],[720,groundY-140,40,20],[900,groundY-220,48,20],[1100,groundY-160,40,20],[1300,groundY-190,64,20],[1520,groundY-140,40,20],[1700,groundY-220,48,20],[1900,groundY-160,40,20],[2100,groundY-200,64,20],[2320,groundY-140,40,20],[2500,groundY-220,48,20],[2700,groundY-160,40,20],[2900,groundY-200,64,20],[3100,groundY-140,40,20],[3320,groundY-220,48,20],[3520,groundY-160,40,20],[3700,groundY-200,64,20]],
        bricks:[[270,groundY-120,40,20],[650,groundY-170,40,20],[1150,groundY-120,40,20],[1750,groundY-170,56,20],[2350,groundY-120,40,20],[2950,groundY-170,40,20],[3450,groundY-120,40,20],[3750,groundY-170,40,20]],
        enemies:[450,700,950,1200,1450,1700,1950,2200,2450,2700,2950,3200,3480,3720],
        coins:[100,240,420,590,720,930,1120,1310,1530,1730,1980,2180,2420,2620,2840,3040,3270,3470,3680,3850],
        trees:[], bushes:[],
        bgColor:0x0a0020,
      },
    };
    return configs[lvl] || configs[1];
  }

  // ── BUILD LEVEL ──────────────────────────────────────────────
  buildLevel(WORLD_W, H) {
    const lvl = this.level;
    const cfg = this.getLevelConfig(lvl, H, WORLD_W);
    this._levelCfg = cfg;
    const G  = this.add.graphics();
    const TS = 32;
    const groundY = H - 64;
    const gH = 64;
    this.groundY = groundY;

    this.cameras.main.setBackgroundColor(cfg.bgColor);

    const addBody = (x, y, w, h) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0, 0);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.body.setSize(w, h).reset(x, y);
      this.platforms.add(zone);
    };

    const addPlatform = (x, y, w, h) => {
      G.fillStyle(cfg.platColor).fillRect(x, y, w, h);
      G.fillStyle(cfg.platTop).fillRect(x, y, w, 6);
      G.fillStyle(cfg.platDirt).fillRect(x, y + 6, w, h - 6);
      G.fillStyle(0xc8a068);
      for (let i = 0; i < Math.floor(w / 8); i++) G.fillRect(x + 4 + i * 8, y + 12, 3, 2);
      if (cfg.grassTufts) {
        G.fillStyle(cfg.platTop);
        for (let i = 0; i < Math.floor(w / 8); i++) {
          G.fillRect(x + 2 + i * 8, y - 3, 4, 4);
          G.fillRect(x + 4 + i * 8, y - 5, 2, 3);
        }
      }
      addBody(x, y, w, h);
    };

    const addBrick = (x, y, w, h) => {
      G.fillStyle(cfg.brickC).fillRect(x, y, w, h);
      G.lineStyle(2, cfg.brickD);
      for (let row = 0; row < h; row += TS / 2)
        G.strokeLineShape(new Phaser.Geom.Line(x, y + row, x + w, y + row));
      for (let col = 0; col < w; col += TS)
        G.strokeLineShape(new Phaser.Geom.Line(x + col, y, x + col, y + h));
      G.fillStyle(0xf8d040).fillRect(x + w / 2 - 5, y + h / 2 - 5, 10, 10);
      G.fillStyle(0xffffff).fillRect(x + w / 2 - 3, y + h / 2 - 3, 4, 4);
      addBody(x, y, w, h);
    };

    cfg.grounds.forEach(([start, len]) => addPlatform(start, groundY, len, gH));
    cfg.floats.forEach(([x, y, w, h])  => addPlatform(x, y, w, h));
    cfg.bricks.forEach(([x, y, w, h])  => addBrick(x, y, w, h));
    this.drawDecorations(G, cfg);
  }

  drawDecorations(G, cfg) {
    cfg.trees.forEach(x  => this.drawTree(G, x, this.groundY - 32));
    cfg.bushes.forEach(x => this.drawBush(G, x, this.groundY - 16));
  }

  drawTree(G, x, y) {
    G.fillStyle(0x8b5e2a).fillRect(x + 12, y + 22, 8, 20);
    G.fillStyle(0x6b4518).fillRect(x + 13, y + 22, 5, 20);
    G.fillStyle(0x2d8a1e).fillCircle(x + 16, y + 14, 18);
    G.fillStyle(0x3aa028).fillCircle(x + 13, y + 16, 14);
    G.fillStyle(0x5cc040).fillCircle(x + 11, y + 19, 8);
  }

  drawBush(G, x, y) {
    G.fillStyle(0x1e6a12).fillCircle(x + 8, y + 8, 10);
    G.fillStyle(0x1e6a12).fillCircle(x + 20, y + 8, 10);
    G.fillStyle(0x2a8a1a).fillCircle(x + 8, y + 7, 8);
    G.fillStyle(0x2a8a1a).fillCircle(x + 20, y + 7, 8);
    G.fillStyle(0x40a030).fillCircle(x + 7, y + 9, 5);
    G.fillStyle(0x40a030).fillCircle(x + 20, y + 9, 5);
  }

  // ── ANIMASI ──────────────────────────────────────────────────
  createAnims() {
    const a = this.anims;
    if (!a.exists('anim_idle'))
      a.create({ key:'anim_idle', frames: a.generateFrameNumbers('idle', {start:0,end:3}), frameRate:6,  repeat:-1 });
    if (!a.exists('anim_walk'))
      a.create({ key:'anim_walk', frames: a.generateFrameNumbers('walk', {start:0,end:8}), frameRate:10, repeat:-1 });
    if (!a.exists('anim_run'))
      a.create({ key:'anim_run',  frames: a.generateFrameNumbers('run',  {start:0,end:7}), frameRate:12, repeat:-1 });
    if (!a.exists('anim_jump'))
      a.create({ key:'anim_jump', frames: a.generateFrameNumbers('jump', {start:0,end:0}), frameRate:1,  repeat:0  });
  }

  // ── SPAWN ENEMIES ────────────────────────────────────────────
  spawnEnemies(H, WORLD_W) {
    const cfg = this._levelCfg;
    const positions = cfg ? cfg.enemies : [600, 900, 1150, 1720, 2300, 2900];
    const speed = 80 + (this.level - 1) * 20;

    positions.forEach(x => {
      const spawnY = this.groundY - 28;
      const gfx = this.add.graphics();
      gfx.fillStyle(0xcc3344).fillRect(0, 6, 28, 20);
      gfx.fillStyle(0xaa5500).fillRect(2, 0, 24, 10);
      gfx.fillStyle(0xffffff).fillRect(4, 8, 7, 7);
      gfx.fillStyle(0xffffff).fillRect(17, 8, 7, 7);
      gfx.fillStyle(0x220011).fillRect(6, 10, 3, 3);
      gfx.fillStyle(0x220011).fillRect(19, 10, 3, 3);
      gfx.fillStyle(0xaa1122).fillRect(2, 24, 10, 8);
      gfx.fillStyle(0xaa1122).fillRect(16, 24, 10, 8);
      const key = 'enemy_' + x;
      gfx.generateTexture(key, 28, 32);
      gfx.destroy();

      const e = this.physics.add.sprite(x, spawnY, key);
      e.setCollideWorldBounds(true).setBounce(0).setVelocityX(-speed).setGravityY(200);
      e.alive = true;
      e.setDepth(5);
      this.enemies.add(e);
    });
  }

  // ── SPAWN COINS ──────────────────────────────────────────────
  spawnCoins(H, WORLD_W) {
    const cfg    = this._levelCfg;
    const coinXs = cfg ? cfg.coins : [200, 330, 510, 660, 780, 1020, 1200, 1380, 1580, 1800];

    if (!this.textures.exists('coin_tex')) {
      const cg = this.add.graphics();
      cg.fillStyle(0xe0a000).fillCircle(10, 10, 10);
      cg.fillStyle(0xffd700).fillCircle(10, 10, 8);
      cg.fillStyle(0xfff4a0).fillCircle(7, 7, 3);
      cg.generateTexture('coin_tex', 20, 20);
      cg.destroy();
    }

    coinXs.forEach(x => {
      const coin = this.coinGroup.create(x, this.groundY - 80, 'coin_tex');
      coin.setDepth(3);
      coin.body.allowGravity = false;
      coin.body.immovable    = true;
      coin.refreshBody();
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
    this.showFloatText(player.x, player.y - 20, '+100', '#ffd700');
    SFX.coin();
  }

  // ── HIT ENEMY ────────────────────────────────────────────────
  hitEnemy(player, enemy) {
    if (this.invincible || !enemy.alive) return;

    // Stomp dari atas
    if (player.body.velocity.y > 0 && player.y < enemy.y - 5) {
      enemy.alive = false;
      enemy.destroy();
      player.setVelocityY(-350);
      this.score += 200;
      this.scoreText.setText('SCORE: ' + this.score);
      this.showFloatText(player.x, player.y - 20, 'STOMP! +200', '#ff8866');
      SFX.stomp();
      return;
    }

    // Kena musuh
    this.lives--;
    this.invincible = true;
    this.invTimer   = 0;
    this.updateHeartsHUD();
    player.setVelocityY(-300);

    this.tweens.add({
      targets: player, alpha: 0.3, yoyo: true,
      repeat: 5, duration: 100,
      onComplete: () => player.setAlpha(1)
    });

    this.showFloatText(player.x, player.y - 20, 'OUCH!', '#ff4466');
    SFX.ouch();

    if (this.lives <= 0) {
      SFX.stopBGM();
      SFX.gameOver();
      this.time.delayedCall(500, () =>
        this.scene.start('GameOver', { score: this.score, coins: this.coins })
      );
    }
  }

  // ── REACH FLAG ───────────────────────────────────────────────
  reachFlag(player, flag) {
    if (this._flagReached) return;
    this._flagReached = true;

    player.setVelocityX(0);
    this.score += 1000 + this.coins * 50;
    this.scoreText.setText('SCORE: ' + this.score);
    this.cameras.main.flash(500, 255, 255, 200);

    SFX.stopBGM();

    if (this.level >= this._maxLevel) {
      this.showFloatText(player.x, player.y - 40, '🏆 GAME CLEAR! 🏆', '#ffe566');
      SFX.gameClear();
      this.registry.set('score', this.score);
      this.registry.set('coins', this.coins);
      this.registry.set('lives', this.lives);
      this.registry.set('level', 1);
      this.time.delayedCall(2500, () =>
        this.scene.start('GameClear', { score: this.score, coins: this.coins })
      );
    } else {
      const nextLevel = this.level + 1;
      this.showFloatText(player.x, player.y - 40, `LEVEL ${nextLevel} MULAI! 🎉`, '#ffe566');
      SFX.levelClear();
      this.registry.set('score', this.score);
      this.registry.set('coins', this.coins);
      this.registry.set('lives', this.lives);
      this.registry.set('level', nextLevel);
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
      fontSize: '14px', fill: color,
      fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(200).setScrollFactor(1);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }

  // ── UPDATE ───────────────────────────────────────────────────
  update(time, delta) {
    if (this.isGameOver || !this.player) return;

    const p      = this.player;
    const cur    = this.cursors;
    const wasd   = this.wasd;
    const onGround = p.body.blocked.down;

    const left     = cur.left.isDown  || wasd.left.isDown;
    const right    = cur.right.isDown || wasd.right.isDown;
    const jump     = Phaser.Input.Keyboard.JustDown(cur.up)    ||
                     Phaser.Input.Keyboard.JustDown(cur.space)  ||
                     Phaser.Input.Keyboard.JustDown(wasd.up);
    const isRunning = wasd.shift.isDown || cur.shift.isDown;
    const speed     = isRunning ? 220 : 140;

    if (left) {
      p.setVelocityX(-speed);
      p.setFlipX(true);
    } else if (right) {
      p.setVelocityX(speed);
      p.setFlipX(false);
    } else {
      p.setVelocityX(0);
    }

    if (jump && onGround) {
      p.setVelocityY(-520);
      SFX.jump();
    }

    if (!onGround) {
      p.play('anim_jump', true);
    } else if (left || right) {
      p.play(isRunning ? 'anim_run' : 'anim_walk', true);
    } else {
      p.play('anim_idle', true);
    }

    this.enemies.getChildren().forEach(e => {
      if (!e.alive) return;
      if (e.body.blocked.right) e.setVelocityX(-80);
      if (e.body.blocked.left)  e.setVelocityX(80);
    });

    if (this.invincible) {
      this.invTimer += delta;
      if (this.invTimer > 1500) { this.invincible = false; this.invTimer = 0; }
    }

    // Jatuh ke bawah dunia
    if (p.y > this.scale.height + 50 && !this._falling && !this._flagReached) {
      this._falling = true;
      this.lives--;
      this.updateHeartsHUD();
      this.registry.set('lives', this.lives);

      if (this.lives <= 0) {
        SFX.stopBGM();
        SFX.gameOver();
        this.time.delayedCall(300, () =>
          this.scene.start('GameOver', { score: this.score, coins: this.coins })
        );
      } else {
        this.time.delayedCall(400, () => {
          p.setPosition(80, this.groundY - 40).setVelocity(0, 0);
          this.invincible = true;
          this.invTimer   = 0;
          this._falling   = false;
          this.time.delayedCall(1500, () => { this.invincible = false; });
        });
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME OVER
// ══════════════════════════════════════════════════════════════════
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.95).fillRect(0, 0, W, H);

    this.add.text(W/2, H/2 - 120, 'GAME OVER', {
      fontSize: '48px', fill: '#ff4466', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#880022', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 - 40, `Skor Akhir: ${this.finalScore}`, {
      fontSize: '22px', fill: '#ffd700', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2, `Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '18px', fill: '#f0c020', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const retry = this.add.text(W/2, H/2 + 80, '↺  COBA LAGI', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold',
      backgroundColor: '#cc3333', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setStyle({ fill: '#ffe566' }));
    retry.on('pointerout',  () => retry.setStyle({ fill: '#ffffff' }));
    retry.on('pointerdown', () => {
      this.registry.set('score', 0);
      this.registry.set('coins', 0);
      this.registry.set('lives', 3);
      this.registry.set('level', 1);
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    this.tweens.add({ targets: retry, scaleX:1.05, scaleY:1.05, yoyo:true, repeat:-1, duration:700 });
    this.cameras.main.fadeIn(500);
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCENE: GAME CLEAR
// ══════════════════════════════════════════════════════════════════
class GameClearScene extends Phaser.Scene {
  constructor() { super('GameClear'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0020, 0x0a0020, 0x200040, 0x200040, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      bg.fillStyle(0xffffff, Math.random());
      bg.fillRect(Math.random()*W, Math.random()*H,
        Math.random()<0.5?1:2, Math.random()<0.5?1:2);
    }

    this.add.text(W/2, H/2 - 130, '🏆', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(W/2, H/2 - 60, 'GAME CLEAR!', {
      fontSize: '40px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#a05000', strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(W/2, H/2, 'Selamat! Kamu telah menyelesaikan semua 5 level!', {
      fontSize: '14px', fill: '#aaddcc', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 40, `Skor Akhir: ${this.finalScore}`, {
      fontSize: '22px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 72, `Total Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '18px', fill: '#f0c020', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const retry = this.add.text(W/2, H/2 + 130, '↩  MAIN LAGI', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold',
      backgroundColor: '#1da56a', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setStyle({ fill: '#ffe566' }));
    retry.on('pointerout',  () => retry.setStyle({ fill: '#ffffff' }));
    retry.on('pointerdown', () => {
      this.registry.set('score', 0);
      this.registry.set('coins', 0);
      this.registry.set('lives', 3);
      this.registry.set('level', 1);
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    this.tweens.add({ targets:retry, scaleX:1.05, scaleY:1.05, yoyo:true, repeat:-1, duration:700 });

    // Kembang api
    this.time.addEvent({
      delay: 400, repeat: 20,
      callback: () => {
        const fx = this.add.graphics();
        const cx = Phaser.Math.Between(100, W - 100);
        const cy = Phaser.Math.Between(50, H / 2);
        const color = [0xff4466, 0xffe566, 0x44ffaa, 0x4488ff, 0xff8800][Phaser.Math.Between(0,4)];
        fx.fillStyle(color);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          fx.fillCircle(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 4);
        }
        this.time.delayedCall(600, () => fx.destroy());
      }
    });

    this.cameras.main.fadeIn(600);
  }
}

// ══════════════════════════════════════════════════════════════════
//  PHASER CONFIG & BOOT
// ══════════════════════════════════════════════════════════════════
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, GameClearScene]
};

new Phaser.Game(config);