// ─── SCENE: LOADING ───────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { 
    super('Boot'); 
  }

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
      fontSize: '28px', fill: '#ffe566',
      fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.load.spritesheet('idle',  'Assets/image/Player/Player_Idle.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('walk',  'Assets/image/Player/Player_walk.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('run',   'Assets/image/Player/Player_run.png',  { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('jump',  'Assets/image/Player/Player_jump.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('climb', 'Assets/image/Player/Player_climb.png',{ frameWidth: 32, frameHeight: 40 });

    this.load.audio('bgm', 'backsound.mp3');
  }

  create() {
    this.scene.start('Menu');
  }
}

// ─── SCENE: MENU ──────────────────────────────────────────────────
class MenuScene extends Phaser.Scene {
  constructor() { 
    super('Menu'); 
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x0d2a1a, 0x0d2a1a, 1);
    bg.fillRect(0, 0, W, H);

    for (let i = 0; i < 80; i++) {
      bg.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      bg.fillRect(Math.random() * W, Math.random() * H * 0.6, Math.random() < 0.5 ? 1 : 2, Math.random() < 0.5 ? 1 : 2);
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

    this.add.text(W / 2, H / 2 + 10, 'Kumpulkan koin 🪙 · Hindari musuh 👾 · Capai bendera 🏁', {
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

// ─── SCENE: GAME ──────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { 
    super('Game'); 
  }

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

    if (!this.sound.get('bgm')) {
      this.music = this.sound.add('bgm', { volume: 0.4, loop: true });
      this.music.play();
    } else if (!this.sound.get('bgm').isPlaying) {
      this.sound.get('bgm').play();
    }

    this.physics.world.setBounds(0, 0, WORLD_W, H);

    // Background fallback gradient (tampil jika aset 'bg' gagal load)
    const bgFill = this.add.graphics();
    bgFill.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xc9eeff, 0xc9eeff, 1);
    bgFill.fillRect(0, 0, WORLD_W, H);
    // Awan dekoratif
    bgFill.fillStyle(0xffffff, 0.75);
    [[150,55,50,22],[420,38,72,28],[750,75,58,20],[1150,48,66,26],[1600,62,48,18],[2100,42,82,30],[2650,68,52,24],[3050,52,62,26]].forEach(([x,y,w,h]) => {
      bgFill.fillEllipse(x, y, w, h);
      bgFill.fillEllipse(x+18, y-7, w*0.65, h*0.75);
      bgFill.fillEllipse(x-14, y+4, w*0.55, h*0.65);
    });

    // Overlay aset bg jika berhasil dimuat
    if (this.textures.exists('bg')) {
      this.add.tileSprite(0, 0, WORLD_W, H, 'bg').setOrigin(0, 0).setScrollFactor(0.3);
    }

    this.platforms = this.physics.add.staticGroup();
    this.createAnims(); 
    this.buildLevel(WORLD_W, H);

    const spawnY = H - 64 - 20; 
    this.player = this.physics.add.sprite(80, spawnY, 'idle');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setGravityY(300);
    this.player.setSize(20, 34);
    this.player.setOffset(6, 5);
    this.player.play('anim_idle');

    this.enemies = this.physics.add.group();
    this.spawnEnemies(H, WORLD_W);

    this.coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spawnCoins(H, WORLD_W);

    const flagX = WORLD_W - 120;
    this.flagZone = this.add.zone(flagX, H - 130, 40, 100);
    this.physics.world.enable(this.flagZone);
    this.flagZone.body.allowGravity = false;

    const flagGfx = this.add.graphics();
    flagGfx.fillStyle(0xaabbcc).fillRect(flagX, H - 230, 4, 160);
    const flagColors = [0xff3344, 0xffaa00, 0xff6600, 0x4488ff, 0xaa44ff];
    flagGfx.fillStyle(flagColors[(this.level-1)] || 0xff3344).fillTriangle(
      flagX + 4, H - 230, flagX + 44, H - 210, flagX + 4, H - 190
    );
    
    this.add.text(flagX + 2, H - 175, `LVL${this.level}`, {
      fontSize: '10px', fill: '#fff', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setDepth(10);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.flagZone, this.reachFlag, null, this);

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.5).fillRect(0, 0, W, 36);
    this.scoreText = this.add.text(12, 8, 'SCORE: ' + this.score, { fontSize: '14px', fill: '#ffd700', fontFamily: 'Courier New', fontStyle: 'bold' });
    this.coinText = this.add.text(200, 8, '🪙 ' + this.coins, { fontSize: '14px', fill: '#f0c020', fontFamily: 'Courier New', fontStyle: 'bold' });
    this.livesText = this.add.text(W / 2, 8, '', { fontSize: '14px', fill: '#ff4466', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.updateHeartsHUD();
    this.levelText = this.add.text(W - 80, 8, 'LVL ' + this.level, { fontSize: '14px', fill: '#88eeff', fontFamily: 'Courier New', fontStyle: 'bold' });
    
    const ctrlText = this.add.text(W / 2, H - 16, '← → Gerak   ↑/Space Lompat   Shift Lari', {
      fontSize: '11px', fill: 'rgba(255,255,255,0.5)', fontFamily: 'Courier New'
    }).setOrigin(0.5, 1);

    this.hud.add([hudBg, this.scoreText, this.coinText, this.livesText, this.levelText, ctrlText]);

    this.invincible = false;
    this.invTimer = 0;
    this._flagReached = false;
    this._falling = false;
  }

  getLevelConfig(lvl, H, WORLD_W) {
    const groundY = H - 64;
    // Format grounds: [start_x, lebar] — gap antar segmen max 120px agar bisa dilompati
    const configs = {
      1: {
        platColor:0x5ac85a, platTop:0x4aaa4a, platDirt:0x8b6733, brickC:0xcc7744, brickD:0x994422, grassTufts:true,
        grounds:[[0,900],[1000,350],[1400,300],[1750,400],[2200,300],[2550,400],[3000,200]],
        floats:[[300,groundY-100,128,20],[500,groundY-160,96,20],[700,groundY-120,128,20],[1100,groundY-130,96,20],[1500,groundY-110,112,20],[1900,groundY-150,96,20],[2300,groundY-120,128,20],[2700,groundY-110,96,20]],
        bricks:[[450,groundY-80,64,20],[950,groundY-130,64,20],[1600,groundY-100,64,20],[2100,groundY-120,64,20]],
        enemies:[650,950,1200,1500,1900,2300],
        coins:[200,350,520,680,800,1050,1300,1550,1800,2100,2400,2700],
        trees:[120,400,680,1100,1600,2000,2500], bushes:[250,500,760,1250,1750,2250,2750], bgColor:0x7ec8e3
      },
      2: {
        platColor:0xd4a843, platTop:0xc89030, platDirt:0xa06820, brickC:0xbb8833, brickD:0x996622, grassTufts:false,
        grounds:[[0,800],[920,500],[1450,400],[1880,450],[2360,400],[2790,410]],
        floats:[[300,groundY-110,128,20],[600,groundY-170,96,20],[980,groundY-130,112,20],[1350,groundY-150,96,20],[1780,groundY-120,128,20],[2150,groundY-160,80,20],[2550,groundY-140,96,20],[2950,groundY-110,112,20]],
        bricks:[[480,groundY-90,64,20],[1100,groundY-130,64,20],[1900,groundY-100,64,20],[2400,groundY-120,64,20]],
        enemies:[650,1000,1400,1800,2200,2600],
        coins:[200,420,650,900,1150,1450,1700,1950,2250,2650,2950],
        trees:[130,520,980,1500,1900,2400,2800], bushes:[300,680,1100,1600,2050,2500],
        bgColor:0xe8c87a
      },
      3: {
        platColor:0x8b3a00, platTop:0xaa5500, platDirt:0x661100, brickC:0xaa3300, brickD:0x882200, grassTufts:false,
        grounds:[[0,750],[870,450],[1350,380],[1760,440],[2230,380],[2640,360],[3020,180]],
        floats:[[280,groundY-120,96,20],[550,groundY-180,80,20],[920,groundY-140,112,20],[1300,groundY-160,96,20],[1700,groundY-130,80,20],[2100,groundY-170,96,20],[2500,groundY-150,80,20],[2850,groundY-120,96,20]],
        bricks:[[420,groundY-100,64,20],[1000,groundY-140,64,20],[1800,groundY-110,64,20],[2300,groundY-130,64,20]],
        enemies:[600,950,1300,1700,2100,2500,2800],
        coins:[190,400,600,850,1100,1400,1650,1950,2280,2680,2950],
        trees:[], bushes:[], bgColor:0x330a00
      },
      4: {
        platColor:0xa0c8f0, platTop:0xffffff, platDirt:0x6090c0, brickC:0x88aacc, brickD:0x6688aa, grassTufts:true,
        grounds:[[0,700],[820,450],[1300,400],[1730,420],[2190,400],[2630,370]],
        floats:[[260,groundY-130,96,20],[500,groundY-190,80,20],[870,groundY-150,112,20],[1260,groundY-170,96,20],[1660,groundY-140,80,20],[2060,groundY-180,96,20],[2460,groundY-160,80,20],[2810,groundY-130,96,20]],
        bricks:[[400,groundY-110,64,20],[970,groundY-150,64,20],[1770,groundY-120,64,20],[2280,groundY-140,64,20]],
        enemies:[550,900,1200,1600,2000,2400,2700],
        coins:[170,380,580,810,1060,1360,1610,1890,2220,2640,2920],
        trees:[110,430,870,1320,1760,2240,2660], bushes:[],
        bgColor:0xc8e8ff
      },
      5: {
        platColor:0x6633aa, platTop:0xaa66ff, platDirt:0x441188, brickC:0x9933cc, brickD:0x661199, grassTufts:false,
        grounds:[[0,650],[780,400],[1210,360],[1600,380],[2010,360],[2410,340],[2790,210]],
        floats:[[240,groundY-140,80,20],[460,groundY-200,64,20],[820,groundY-160,96,20],[1160,groundY-180,80,20],[1550,groundY-150,64,20],[1900,groundY-190,80,20],[2280,groundY-170,64,20],[2660,groundY-140,80,20],[2960,groundY-160,64,20]],
        bricks:[[380,groundY-120,64,20],[910,groundY-160,64,20],[1700,groundY-130,64,20],[2290,groundY-150,64,20]],
        enemies:[500,830,1150,1560,1960,2360,2710,2980],
        coins:[150,340,530,760,1000,1250,1510,1780,2100,2450,2810],
        trees:[], bushes:[], bgColor:0x0a0020
      }
    };
    return configs[lvl] || configs[1];
  }

  buildLevel(WORLD_W, H) {
    const cfg = this.getLevelConfig(this.level, H, WORLD_W);
    this._levelCfg = cfg;
    const G = this.add.graphics();
    const TS = 32;
    const groundY = H - 64;
    this.groundY = groundY;

    this.cameras.main.setBackgroundColor(cfg.bgColor);

    const addBody = (x, y, w, h) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0, 0);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      zone.body.setSize(w, h);
      this.platforms.add(zone);
    };

    const addPlatform = (x, y, w, h) => {
      G.fillStyle(cfg.platColor).fillRect(x, y, w, h);
      G.fillStyle(cfg.platTop).fillRect(x, y, w, 6);
      G.fillStyle(cfg.platDirt).fillRect(x, y + 6, w, h - 6);
      if (cfg.grassTufts) {
        G.fillStyle(cfg.platTop);
        for (let i = 0; i < Math.floor(w / 8); i++) {
          G.fillRect(x + 2 + i * 8, y - 3, 4, 4);
        }
      }
      addBody(x, y, w, h);
    };

    const addBrick = (x, y, w, h) => {
      G.fillStyle(cfg.brickC).fillRect(x, y, w, h);
      G.lineStyle(2, cfg.brickD);
      for (let row = 0; row < h; row += TS / 2) {
        G.strokeLineShape(new Phaser.Geom.Line(x, y + row, x + w, y + row));
      }
      addBody(x, y, w, h);
    };

    cfg.grounds.forEach(([start, len]) => addPlatform(start, groundY, len, 64));
    cfg.floats.forEach(([x, y, w, h]) => addPlatform(x, y, w, h));
    cfg.bricks.forEach(([x, y, w, h]) => addBrick(x, y, w, h));

    cfg.trees.forEach(x => this.drawTree(G, x, groundY - 42));
    cfg.bushes.forEach(x => this.drawBush(G, x, groundY - 16));
  }

  drawTree(G, x, y) {
    G.fillStyle(0x8b5e2a).fillRect(x + 12, y + 22, 8, 20);
    G.fillStyle(0x2d8a1e).fillCircle(x + 16, y + 14, 18);
  }

  drawBush(G, x, y) {
    G.fillStyle(0x1e6a12).fillCircle(x + 8, y + 8, 10);
    G.fillStyle(0x1e6a12).fillCircle(x + 20, y + 8, 10);
  }

  createAnims() {
    const anims = this.anims;

    if (!anims.exists('anim_idle')) {
      anims.create({ key: 'anim_idle', frames: anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    }
    if (!anims.exists('anim_walk')) {
      anims.create({ key: 'anim_walk', frames: anims.generateFrameNumbers('walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    }
    if (!anims.exists('anim_run')) {
      anims.create({ key: 'anim_run', frames: anims.generateFrameNumbers('run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    }
    if (!anims.exists('anim_jump')) {
      anims.create({ key: 'anim_jump', frames: anims.generateFrameNumbers('jump', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
    }

    if (!this.textures.exists('coin_sheet')) {
      const FRAME_W = 20, FRAME_H = 20, FRAMES = 6;
      const canvasTex = this.textures.createCanvas('coin_sheet', FRAME_W * FRAMES, FRAME_H);
      const ctx = canvasTex.getContext('2d');

      const widths = [20, 14, 6, 4, 10, 16];
      for (let i = 0; i < FRAMES; i++) {
        const cx = i * FRAME_W + FRAME_W / 2;
        const cy = FRAME_H / 2;
        const rx = Math.max(widths[i] / 2, 1);
        const ry = 8;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
        grad.addColorStop(0, '#fff5aa');
        grad.addColorStop(0.4, '#ffd700');
        grad.addColorStop(1, '#cc9900');
        ctx.fillStyle = grad;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();

        if (rx > 3) {
          ctx.beginPath();
          ctx.strokeStyle = '#ffa500';
          ctx.lineWidth = 1;
          ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }

        canvasTex.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
      }

      canvasTex.refresh();
    }

    if (!anims.exists('anim_coin')) {
      anims.create({ key: 'anim_coin', frames: anims.generateFrameNumbers('coin_sheet', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    }
  }

  spawnEnemies(H, WORLD_W) {
    const cfg = this._levelCfg;
    const positions = cfg ? cfg.enemies : [600, 900];
    const speed = 80 + (this.level - 1) * 20;

    positions.forEach(x => {
      const spawnY = this.groundY - 32;
      const key = 'enemy_' + x;

      if (!this.textures.exists(key)) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xcc3344).fillRect(0, 0, 28, 32);
        gfx.generateTexture(key, 28, 32);
        gfx.destroy();
      }

      const e = this.physics.add.sprite(x, spawnY, key);
      e.setCollideWorldBounds(true);
      e.setVelocityX(-speed);
      e.setGravityY(300);
      e.alive = true;
      this.enemies.add(e);
    });
  }

  spawnCoins(H, WORLD_W) {
    const cfg = this._levelCfg;
    const coinXs = cfg ? cfg.coins : [200, 330];

    coinXs.forEach(x => {
      const coin = this.coinGroup.create(x, this.groundY - 60, 'coin_sheet');
      coin.play('anim_coin');
    });
  }

  playHurtSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      const bufSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime);

      setTimeout(() => ctx.close(), 500);
    } catch (e) {}
  }

  playCoinSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1567, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(2093, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.0, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.32);

      setTimeout(() => ctx.close(), 400);
    } catch (e) {}
  }

  collectCoin(player, coin) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    coin.body.enable = false;
    this.coins++;
    this.score += 100;
    this.scoreText.setText('SCORE: ' + this.score);
    this.coinText.setText('🪙 ' + this.coins);
    this.showFloatText(player.x, player.y - 20, '+100', '#ffd700');
    this.playCoinSound();
  }

  playHitSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      const bufSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      noise.buffer = buffer;
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.12);

      setTimeout(() => ctx.close(), 500);
    } catch (e) {}
  }

  hitEnemy(player, enemy) {
    if (this.invincible || !enemy.alive) return;

    if (player.body.velocity.y > 0 && player.y < enemy.y - 5) {
      enemy.alive = false;
      enemy.destroy();
      player.setVelocityY(-350);
      this.score += 200;
      this.scoreText.setText('SCORE: ' + this.score);
      this.showFloatText(player.x, player.y - 20, 'STOMP! +200', '#ff8866');
      return;
    }

    this.lives--;
    this.invincible = true;
    this.invTimer = 0;
    this.updateHeartsHUD();
    this.playHitSound();
    player.setVelocityY(-250);

    this.tweens.add({
      targets: player, alpha: 0.3, yoyo: true, repeat: 5, duration: 100,
      onComplete: () => { player.setAlpha(1); }
    });

    if (this.lives <= 0) {
      if (this.music) this.music.stop(); 
      this.scene.start('GameOver', { score: this.score, coins: this.coins });
    }
  }

  reachFlag(player, flag) {
    if (this._flagReached) return;
    this._flagReached = true;
    player.setVelocityX(0);

    if (this.level >= this._maxLevel) {
      if (this.music) this.music.stop(); 
      this.registry.set('score', this.score);
      this.registry.set('coins', this.coins);
      this.scene.start('GameClear', { score: this.score, coins: this.coins });
    } else {
      this.registry.set('score', this.score);
      this.registry.set('coins', this.coins);
      this.registry.set('lives', this.lives);
      this.registry.set('level', this.level + 1);
      this.scene.restart();
    }
  }

  updateHeartsHUD() {
    const h = Array.from({ length: 3 }, (_, i) => i < this.lives ? '❤' : '🖤').join(' ');
    this.livesText.setText(h);
  }

  showFloatText(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontSize: '14px', fill: color, fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    if (this.isGameOver || !this.player) return;

    const p = this.player;
    const onGround = p.body.blocked.down;
    const left    = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right   = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump    = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.wasd.up);
    const isRunning = this.wasd.shift.isDown || this.cursors.shift.isDown;

    const speed = isRunning ? 220 : 140;

    if (left) {
      p.setVelocityX(-speed);
      p.setFlipX(true);
    } else if (right) {
      p.setVelocityX(speed);
      p.setFlipX(false);
    } else {
      p.setVelocityX(0);
    }

    if (jump && onGround) p.setVelocityY(-520);

    if (!onGround) {
      p.play('anim_jump', true);
    } else if (left || right) {
      p.play(isRunning ? 'anim_run' : 'anim_walk', true);
    } else {
      p.play('anim_idle', true);
    }

    this.enemies.getChildren().forEach(e => {
      if (e.body.blocked.right) e.setVelocityX(-80);
      if (e.body.blocked.left)  e.setVelocityX(80);
    });

    if (this.invincible) {
      this.invTimer += delta;
      if (this.invTimer > 1500) this.invincible = false;
    }

    if (p.y > this.scale.height + 50 && !this._falling) {
      this._falling = true;
      this.lives--;
      this.updateHeartsHUD();
      this.playHitSound();
      if (this.lives <= 0) {
        if (this.music) this.music.stop();
        this.scene.start('GameOver', { score: this.score, coins: this.coins });
      } else {
        p.setPosition(80, this.groundY - 40);
        p.setVelocity(0, 0);
        this._falling = false;
        this.invincible = true;
        this.invTimer = 0;
      }
    }
  }
}

// ─── SCENE: GAME OVER ─────────────────────────────────────────────
class GameOverScene extends Phaser.Scene {
  constructor() { 
    super('GameOver'); 
  }
  init(data) { 
    this.finalScore = data.score || 0; 
    this.finalCoins = data.coins || 0; 
  }
  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.graphics().fillStyle(0x0a0a1a, 0.95).fillRect(0, 0, W, H);
    this.add.text(W / 2, H / 2 - 80, 'GAME OVER', {
      fontSize: '48px', fill: '#ff4466', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 20, `Skor: ${this.finalScore}  |  Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    const retry = this.add.text(W / 2, H / 2 + 50, '↺  COBA LAGI', {
      fontSize: '22px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold',
      backgroundColor: '#cc3333', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setStyle({ fill: '#ffe566' }));
    retry.on('pointerout',  () => retry.setStyle({ fill: '#ffffff' }));
    retry.on('pointerdown', () => this.scene.start('Menu'));
  }
}

// ─── SCENE: GAME CLEAR ───────────────────────────────────────────
class GameClearScene extends Phaser.Scene {
  constructor() { 
    super('GameClear'); 
  }
  init(data) { 
    this.finalScore = data.score || 0; 
    this.finalCoins = data.coins || 0; 
  }
  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.graphics().fillGradientStyle(0x0a0020, 0x0a0020, 0x200040, 0x200040, 1).fillRect(0, 0, W, H);

    const g = this.add.graphics();
    for (let i = 0; i < 100; i++) {
      g.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }

    this.add.text(W / 2, H / 2 - 60, '🏆 GAME CLEAR!', {
      fontSize: '40px', fill: '#ffe566', fontFamily: 'Courier New', fontStyle: 'bold',
      stroke: '#aa7700', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 10, `Skor Akhir: ${this.finalScore}  |  Koin: 🪙 ${this.finalCoins}`, {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 70, '↩  MAIN LAGI', {
      fontSize: '20px', fill: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold',
      backgroundColor: '#1da56a', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ fill: '#ffe566' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.start('Menu'));
  }
}

// ─── PHASER GAME CONFIGURATION ────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, GameClearScene]
};

const game = new Phaser.Game(config);