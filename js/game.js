// === CONSTANTS ===
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_Y = 450;
const PLAY_AREA_TOP = 350;
const PLAY_AREA_BOTTOM = 550;

const COLORS = {
  bg: '#0a0a1a',
  floor: '#1a1a2e',
  floorGrid: '#2a2a4e',
  serverRack: '#2a2a3e',
  serverLight: '#00ff00',
  serverLightOff: '#003300',
  neonCyan: '#00ffff',
  neonPink: '#ff00ff',
  neonGreen: '#00ff00',
  healthBar: '#00ff00',
  healthBarBg: '#003300',
  white: '#ffffff',
  black: '#000000'
};

const PLAYER_COLORS = {
  gi: '#8B4513',
  giTrim: '#FFD700',
  skin: '#FFDAB9',
  hair: '#FF6347',
  gloves: '#1a1a1a',
  glasses: '#333333'
};

const ENEMY_COLORS = {
  drone: {
    body: '#4a4a6a',
    hoodie: '#2a2a4a',
    laptop: '#333333',
    screen: '#00ff00'
  },
  injector: {
    cloak: '#1a0a2a',
    hood: '#0a0020',
    glow: '#ff00ff'
  },
  boss: {
    armor: '#8B0000',
    trim: '#FFD700',
    eyes: '#ff0000',
    cape: '#4a0000'
  }
};

// Game states
const STATE = {
  MENU: 'MENU',
  DIFFICULTY_SELECT: 'DIFFICULTY_SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  WAVE_INTRO: 'WAVE_INTRO'
};

// Difficulty settings
const DIFFICULTIES = [
  {
    name: 'SCRIPT KIDDIE',
    description: 'Easy mode - for casual browsing',
    enemyHealthMult: 1.0,
    enemyDamageMult: 1.0,
    enemySpeedMult: 1.0,
    enemyCountMult: 1.0
  },
  {
    name: 'SYSADMIN',
    description: 'Hard mode - elevated privileges required',
    enemyHealthMult: 1.5,
    enemyDamageMult: 1.5,
    enemySpeedMult: 1.2,
    enemyCountMult: 1.25
  },
  {
    name: 'KERNEL PANIC',
    description: 'Brutal mode - total system failure',
    enemyHealthMult: 2.0,
    enemyDamageMult: 2.0,
    enemySpeedMult: 1.4,
    enemyCountMult: 1.5
  }
];

let selectedDifficulty = 0;
let currentDifficulty = DIFFICULTIES[0];

// === GAME VARIABLES ===
let canvas, ctx;
let gameState = STATE.MENU;
let lastTime = 0;
let deltaTime = 0;
let score = 0;
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
let screenShake = 0;
let hitPause = 0;
let waveIntroTimer = 0;

// === INPUT SYSTEM ===
const keys = {};
const keysJustPressed = {};

function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
      keysJustPressed[e.code] = true;
    }
    keys[e.code] = true;
    e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    e.preventDefault();
  });
}

function clearJustPressed() {
  for (let key in keysJustPressed) {
    keysJustPressed[key] = false;
  }
}

function isPressed(codes) {
  return codes.some(code => keys[code]);
}

function justPressed(codes) {
  return codes.some(code => keysJustPressed[code]);
}

// === AUDIO SYSTEM ===
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;

  switch(type) {
    case 'punch':
      playSynthSound(440, 0.05, 'square', 0.3);
      playSynthSound(880, 0.03, 'square', 0.2);
      break;
    case 'kick':
      playSynthSound(220, 0.08, 'square', 0.4);
      playSynthSound(110, 0.1, 'triangle', 0.3);
      break;
    case 'special':
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playSynthSound(300 + i * 100, 0.1, 'sawtooth', 0.2), i * 30);
      }
      break;
    case 'enemyHit':
      playSynthSound(200, 0.05, 'square', 0.25);
      playNoise(0.05, 0.15);
      break;
    case 'enemyDefeat':
      playSynthSound(400, 0.1, 'square', 0.3);
      playSynthSound(300, 0.1, 'square', 0.25, 0.05);
      playSynthSound(200, 0.15, 'square', 0.2, 0.1);
      playNoise(0.15, 0.2);
      break;
    case 'playerHurt':
      playSynthSound(300, 0.05, 'sawtooth', 0.3);
      playSynthSound(250, 0.05, 'sawtooth', 0.25, 0.03);
      playSynthSound(200, 0.05, 'sawtooth', 0.2, 0.06);
      break;
    case 'gameOver':
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playSynthSound(400 - i * 80, 0.2, 'triangle', 0.3), i * 150);
      }
      break;
    case 'victory':
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => playSynthSound(freq, 0.15, 'square', 0.25), i * 100);
      });
      setTimeout(() => {
        playSynthSound(1047, 0.4, 'square', 0.3);
        playSynthSound(784, 0.4, 'triangle', 0.2);
      }, 500);
      break;
    case 'waveStart':
      playSynthSound(440, 0.1, 'square', 0.2);
      playSynthSound(550, 0.1, 'square', 0.2, 0.1);
      playSynthSound(660, 0.15, 'square', 0.25, 0.2);
      break;
    case 'menuSelect':
      playSynthSound(660, 0.08, 'square', 0.2);
      break;
  }
}

function playSynthSound(freq, duration, type, volume, delay = 0) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
}

function playNoise(duration, volume) {
  if (!audioCtx) return;

  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  noise.buffer = buffer;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  noise.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start();
}

// === PARTICLE SYSTEM ===
const particles = [];

class Particle {
  constructor(x, y, color, vx, vy, life, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 500 * dt; // gravity
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.life <= 0;
  }
}

function spawnHitParticles(x, y, color = COLORS.neonCyan) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
    const speed = 100 + Math.random() * 150;
    particles.push(new Particle(
      x, y,
      color,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 50,
      0.3 + Math.random() * 0.2,
      3 + Math.random() * 3
    ));
  }
}

function spawnDefeatParticles(x, y) {
  const colors = [COLORS.neonCyan, COLORS.neonPink, COLORS.neonGreen, '#ffffff'];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 200;
    particles.push(new Particle(
      x, y,
      colors[Math.floor(Math.random() * colors.length)],
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 100,
      0.4 + Math.random() * 0.4,
      2 + Math.random() * 6
    ));
  }
}

function spawnCodeFragments(x, y) {
  const chars = ['0', '1', '{', '}', '<', '>', '/', '\\', '*', '#'];
  for (let i = 0; i < 5; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    codeFragments.push({
      x: x,
      y: y,
      char: char,
      vx: (Math.random() - 0.5) * 100,
      vy: -100 - Math.random() * 50,
      life: 0.5 + Math.random() * 0.3
    });
  }
}

const codeFragments = [];

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(dt);
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  for (let i = codeFragments.length - 1; i >= 0; i--) {
    const frag = codeFragments[i];
    frag.x += frag.vx * dt;
    frag.y += frag.vy * dt;
    frag.vy += 300 * dt;
    frag.life -= dt;
    if (frag.life <= 0) {
      codeFragments.splice(i, 1);
    }
  }
}

function drawParticles(ctx) {
  particles.forEach(p => p.draw(ctx));

  ctx.font = '12px Courier New';
  codeFragments.forEach(frag => {
    ctx.globalAlpha = frag.life * 2;
    ctx.fillStyle = COLORS.neonGreen;
    ctx.fillText(frag.char, frag.x, frag.y);
  });
  ctx.globalAlpha = 1;
}

// === PLAYER CLASS ===
class Player {
  constructor() {
    this.x = 100;
    this.y = GROUND_Y;
    this.z = 0;
    this.width = 48;
    this.height = 64;
    this.vx = 0;
    this.vy = 0;
    this.speed = 200;
    this.health = 100;
    this.maxHealth = 100;
    this.facing = 1; // 1 = right, -1 = left
    this.state = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this.attackTimer = 0;
    this.attackDuration = 0;
    this.invincibleTimer = 0;
    this.specialCooldown = 0;
    this.attackHitbox = null;
    this.hasHitThisAttack = [];
  }

  update(dt) {
    // Update timers
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'idle';
        this.attackHitbox = null;
        this.hasHitThisAttack = [];
      }
    }

    // Handle input when not attacking
    if (this.state === 'idle' || this.state === 'walk') {
      let moveX = 0;
      let moveY = 0;

      if (isPressed(['KeyW', 'ArrowUp'])) moveY = -1;
      if (isPressed(['KeyS', 'ArrowDown'])) moveY = 1;
      if (isPressed(['KeyA', 'ArrowLeft'])) { moveX = -1; this.facing = -1; }
      if (isPressed(['KeyD', 'ArrowRight'])) { moveX = 1; this.facing = 1; }

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.707;
        moveY *= 0.707;
      }

      this.vx = moveX * this.speed;
      this.vy = moveY * this.speed;

      this.state = (moveX !== 0 || moveY !== 0) ? 'walk' : 'idle';

      // Attacks
      if (justPressed(['KeyZ', 'KeyJ'])) {
        this.startAttack('punch');
      } else if (justPressed(['KeyX', 'KeyK'])) {
        this.startAttack('kick');
      } else if (justPressed(['KeyC', 'KeyL']) && this.specialCooldown <= 0) {
        this.startAttack('special');
        this.specialCooldown = 3;
      }
    } else if (this.state === 'hurt') {
      this.vx *= 0.9;
      this.vy *= 0.9;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Boundaries
    this.x = Math.max(this.width/2, Math.min(GAME_WIDTH - this.width/2, this.x));
    this.y = Math.max(PLAY_AREA_TOP, Math.min(PLAY_AREA_BOTTOM, this.y));

    // Animation
    this.animTimer += dt;
    if (this.animTimer >= 0.1) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Update attack hitbox position during attacks
    if (this.attackTimer > 0) {
      this.updateAttackHitbox();
    }
  }

  startAttack(type) {
    this.state = type;
    this.animFrame = 0;
    this.hasHitThisAttack = [];

    switch(type) {
      case 'punch':
        this.attackDuration = 0.25;
        this.attackTimer = this.attackDuration;
        playSound('punch');
        break;
      case 'kick':
        this.attackDuration = 0.35;
        this.attackTimer = this.attackDuration;
        playSound('kick');
        break;
      case 'special':
        this.attackDuration = 0.5;
        this.attackTimer = this.attackDuration;
        playSound('special');
        spawnHitParticles(this.x, this.y - 30, COLORS.neonPink);
        break;
    }

    this.updateAttackHitbox();
  }

  updateAttackHitbox() {
    const attackProgress = 1 - (this.attackTimer / this.attackDuration);

    if (attackProgress < 0.2 || attackProgress > 0.6) {
      this.attackHitbox = null;
      return;
    }

    switch(this.state) {
      case 'punch':
        this.attackHitbox = {
          x: this.x + this.facing * 30,
          y: this.y - 35,
          width: 30,
          height: 20,
          damage: 10
        };
        break;
      case 'kick':
        this.attackHitbox = {
          x: this.x + this.facing * 35,
          y: this.y - 25,
          width: 40,
          height: 25,
          damage: 15
        };
        break;
      case 'special':
        this.attackHitbox = {
          x: this.x - 60,
          y: this.y - 50,
          width: 120,
          height: 60,
          damage: 25,
          isSpecial: true
        };
        break;
    }
  }

  takeDamage(amount, knockbackDir) {
    if (this.invincibleTimer > 0) return;

    this.health -= amount;
    this.invincibleTimer = 1;
    this.state = 'hurt';
    this.attackTimer = 0.3;
    this.vx = knockbackDir * 200;

    playSound('playerHurt');
    screenShake = 10;

    if (this.health <= 0) {
      this.health = 0;
      gameState = STATE.GAME_OVER;
      playSound('gameOver');
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flicker when invincible
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.scale(this.facing, 1);

    // Draw based on state
    switch(this.state) {
      case 'idle':
        this.drawIdle(ctx);
        break;
      case 'walk':
        this.drawWalk(ctx);
        break;
      case 'punch':
        this.drawPunch(ctx);
        break;
      case 'kick':
        this.drawKick(ctx);
        break;
      case 'special':
        this.drawSpecial(ctx);
        break;
      case 'hurt':
        this.drawHurt(ctx);
        break;
    }

    ctx.restore();
  }

  drawIdle(ctx) {
    const bob = Math.sin(this.animFrame * Math.PI / 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-12, -30 + bob, 10, 30);
    ctx.fillRect(2, -30 + bob, 10, 30);

    // Feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-14, -4 + bob, 14, 6);
    ctx.fillRect(0, -4 + bob, 14, 6);

    // Body/Gi
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-16, -55 + bob, 32, 30);

    // Gi trim
    ctx.fillStyle = PLAYER_COLORS.giTrim;
    ctx.fillRect(-16, -55 + bob, 4, 30);
    ctx.fillRect(12, -55 + bob, 4, 30);
    ctx.fillRect(-16, -55 + bob, 32, 4);

    // Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-14, -30 + bob, 28, 5);

    // Arms
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-22, -52 + bob, 10, 20);
    ctx.fillRect(12, -52 + bob, 10, 20);

    // Gloves
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(-24, -35 + bob, 12, 10);
    ctx.fillRect(12, -35 + bob, 12, 10);

    // Head
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-10, -72 + bob, 20, 20);

    // Hair (ginger/red)
    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-12, -76 + bob, 24, 10);
    ctx.fillRect(-12, -72 + bob, 6, 8);
    ctx.fillRect(6, -72 + bob, 6, 8);

    // Glasses
    ctx.fillStyle = PLAYER_COLORS.glasses;
    ctx.fillRect(-8, -68 + bob, 8, 5);
    ctx.fillRect(0, -68 + bob, 8, 5);
    ctx.fillStyle = '#6699ff';
    ctx.fillRect(-6, -67 + bob, 4, 3);
    ctx.fillRect(2, -67 + bob, 4, 3);
  }

  drawWalk(ctx) {
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 8;
    const bob = Math.abs(Math.sin(this.animFrame * Math.PI / 2)) * 3;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-12 + legOffset/2, -30 + bob, 10, 30);
    ctx.fillRect(2 - legOffset/2, -30 + bob, 10, 30);

    // Feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-14 + legOffset, -4, 14, 6);
    ctx.fillRect(0 - legOffset, -4, 14, 6);

    // Body/Gi
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-16, -55 + bob, 32, 30);

    // Gi trim
    ctx.fillStyle = PLAYER_COLORS.giTrim;
    ctx.fillRect(-16, -55 + bob, 4, 30);
    ctx.fillRect(12, -55 + bob, 4, 30);

    // Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-14, -30 + bob, 28, 5);

    // Arms (swinging)
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-22 - legOffset/2, -52 + bob, 10, 20);
    ctx.fillRect(12 + legOffset/2, -52 + bob, 10, 20);

    // Gloves
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(-24 - legOffset/2, -35 + bob, 12, 10);
    ctx.fillRect(12 + legOffset/2, -35 + bob, 12, 10);

    // Head
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-10, -72 + bob, 20, 20);

    // Hair
    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-12, -76 + bob, 24, 10);
    ctx.fillRect(-12, -72 + bob, 6, 8);
    ctx.fillRect(6, -72 + bob, 6, 8);

    // Glasses
    ctx.fillStyle = PLAYER_COLORS.glasses;
    ctx.fillRect(-8, -68 + bob, 8, 5);
    ctx.fillRect(0, -68 + bob, 8, 5);
    ctx.fillStyle = '#6699ff';
    ctx.fillRect(-6, -67 + bob, 4, 3);
    ctx.fillRect(2, -67 + bob, 4, 3);
  }

  drawPunch(ctx) {
    const progress = 1 - (this.attackTimer / this.attackDuration);
    const punchExtend = Math.sin(progress * Math.PI) * 25;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (stance)
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-15, -30, 10, 30);
    ctx.fillRect(5, -30, 10, 30);

    // Feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-17, -4, 14, 6);
    ctx.fillRect(3, -4, 14, 6);

    // Body leaning forward
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-14 + punchExtend/4, -55, 32, 30);

    // Gi trim
    ctx.fillStyle = PLAYER_COLORS.giTrim;
    ctx.fillRect(-14 + punchExtend/4, -55, 4, 30);
    ctx.fillRect(14 + punchExtend/4, -55, 4, 30);

    // Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-12 + punchExtend/4, -30, 28, 5);

    // Back arm
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-20, -50, 10, 18);
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(-22, -35, 12, 10);

    // Punching arm extended
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(10 + punchExtend/2, -48, 15 + punchExtend/2, 12);

    // Fist
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(22 + punchExtend, -50, 16, 16);

    // Head
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-8 + punchExtend/4, -72, 20, 20);

    // Hair
    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-10 + punchExtend/4, -76, 24, 10);
    ctx.fillRect(-10 + punchExtend/4, -72, 6, 8);
    ctx.fillRect(8 + punchExtend/4, -72, 6, 8);

    // Glasses
    ctx.fillStyle = PLAYER_COLORS.glasses;
    ctx.fillRect(-6 + punchExtend/4, -68, 8, 5);
    ctx.fillRect(2 + punchExtend/4, -68, 8, 5);
    ctx.fillStyle = '#6699ff';
    ctx.fillRect(-4 + punchExtend/4, -67, 4, 3);
    ctx.fillRect(4 + punchExtend/4, -67, 4, 3);

    // Impact effect
    if (progress > 0.3 && progress < 0.6) {
      ctx.strokeStyle = COLORS.neonCyan;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI/2;
        const len = 15;
        ctx.beginPath();
        ctx.moveTo(35 + punchExtend, -42);
        ctx.lineTo(35 + punchExtend + Math.cos(angle) * len, -42 + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
  }

  drawKick(ctx) {
    const progress = 1 - (this.attackTimer / this.attackDuration);
    const kickExtend = Math.sin(progress * Math.PI) * 30;
    const kickHeight = Math.sin(progress * Math.PI) * 10;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Standing leg
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-15, -30, 10, 30);
    ctx.fillStyle = '#333';
    ctx.fillRect(-17, -4, 14, 6);

    // Kicking leg
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.save();
    ctx.translate(5, -25 - kickHeight);
    ctx.rotate(Math.sin(progress * Math.PI) * 0.8);
    ctx.fillRect(0, -5, 35 + kickExtend/2, 12);
    // Foot
    ctx.fillStyle = '#333';
    ctx.fillRect(30 + kickExtend/2, -7, 18, 16);
    ctx.restore();

    // Body leaning back
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-18, -55, 32, 30);

    // Gi trim
    ctx.fillStyle = PLAYER_COLORS.giTrim;
    ctx.fillRect(-18, -55, 4, 30);
    ctx.fillRect(10, -55, 4, 30);

    // Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-16, -30, 28, 5);

    // Arms (guard position)
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-24, -50, 10, 18);
    ctx.fillRect(8, -50, 10, 18);
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(-26, -35, 12, 10);
    ctx.fillRect(6, -35, 12, 10);

    // Head
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-12, -72, 20, 20);

    // Hair
    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-14, -76, 24, 10);
    ctx.fillRect(-14, -72, 6, 8);
    ctx.fillRect(4, -72, 6, 8);

    // Glasses
    ctx.fillStyle = PLAYER_COLORS.glasses;
    ctx.fillRect(-10, -68, 8, 5);
    ctx.fillRect(-2, -68, 8, 5);
    ctx.fillStyle = '#6699ff';
    ctx.fillRect(-8, -67, 4, 3);
    ctx.fillRect(0, -67, 4, 3);

    // Impact effect
    if (progress > 0.3 && progress < 0.6) {
      ctx.strokeStyle = COLORS.neonPink;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI - Math.PI/2;
        const len = 18;
        ctx.beginPath();
        ctx.moveTo(45 + kickExtend/2, -25 - kickHeight);
        ctx.lineTo(45 + kickExtend/2 + Math.cos(angle) * len, -25 - kickHeight + Math.sin(angle) * len);
        ctx.stroke();
      }
    }
  }

  drawSpecial(ctx) {
    const progress = 1 - (this.attackTimer / this.attackDuration);
    const glow = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;

    // Energy aura
    ctx.fillStyle = `rgba(255, 0, 255, ${0.3 * glow})`;
    ctx.beginPath();
    ctx.ellipse(0, -35, 50 + glow * 20, 40 + glow * 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (wide stance)
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-20, -30, 10, 30);
    ctx.fillRect(10, -30, 10, 30);

    // Feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-22, -4, 14, 6);
    ctx.fillRect(8, -4, 14, 6);

    // Body
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-16, -55, 32, 30);

    // Glowing gi trim
    ctx.fillStyle = `rgb(255, ${Math.floor(215 + glow * 40)}, 0)`;
    ctx.fillRect(-16, -55, 4, 30);
    ctx.fillRect(12, -55, 4, 30);
    ctx.fillRect(-16, -55, 32, 4);

    // Belt
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-14, -30, 28, 5);

    // Arms raised
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-28, -65, 12, 20);
    ctx.fillRect(16, -65, 12, 20);

    // Glowing gloves
    ctx.fillStyle = COLORS.neonPink;
    ctx.fillRect(-30, -70, 14, 12);
    ctx.fillRect(16, -70, 14, 12);

    // Energy between hands
    ctx.fillStyle = `rgba(255, 0, 255, ${0.5 + glow * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(0, -68, 15 + glow * 5, 8 + glow * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-10, -82, 20, 20);

    // Hair (flowing up from energy)
    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-12, -90, 24, 12);
    ctx.fillRect(-14, -88, 6, 10);
    ctx.fillRect(8, -88, 6, 10);

    // Glowing glasses
    ctx.fillStyle = COLORS.neonCyan;
    ctx.fillRect(-8, -78, 8, 5);
    ctx.fillRect(0, -78, 8, 5);
  }

  drawHurt(ctx) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stumbling pose
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-15, -28, 10, 28);
    ctx.fillRect(0, -30, 10, 30);

    ctx.fillStyle = '#333';
    ctx.fillRect(-17, -4, 14, 6);
    ctx.fillRect(-2, -4, 14, 6);

    // Body bent back
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-20, -52, 32, 28);
    ctx.fillStyle = PLAYER_COLORS.giTrim;
    ctx.fillRect(-20, -52, 4, 28);
    ctx.fillRect(8, -52, 4, 28);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-18, -28, 28, 5);

    // Arms flailing
    ctx.fillStyle = PLAYER_COLORS.gi;
    ctx.fillRect(-30, -48, 12, 16);
    ctx.fillRect(10, -55, 12, 16);
    ctx.fillStyle = PLAYER_COLORS.gloves;
    ctx.fillRect(-32, -35, 12, 10);
    ctx.fillRect(12, -42, 12, 10);

    // Head tilted
    ctx.fillStyle = PLAYER_COLORS.skin;
    ctx.fillRect(-14, -70, 20, 20);

    ctx.fillStyle = PLAYER_COLORS.hair;
    ctx.fillRect(-16, -74, 24, 10);

    // Dizzy stars
    const starAngle = Date.now() / 200;
    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 3; i++) {
      const angle = starAngle + (i * Math.PI * 2 / 3);
      const sx = Math.cos(angle) * 25;
      const sy = Math.sin(angle) * 10 - 80;
      ctx.fillRect(sx - 3, sy - 3, 6, 6);
    }
  }
}

// === ENEMY BASE CLASS ===
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 40;
    this.height = 56;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.state = 'idle';
    this.aiState = 'approach';
    this.animFrame = 0;
    this.animTimer = 0;
    this.attackTimer = 0;
    this.stunTimer = 0;
    this.attackCooldown = 0;
    this.dead = false;

    this.setStats();
    this.applyDifficulty();
  }

  setStats() {
    // Override in subclass
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 5;
    this.speed = 80;
    this.attackRange = 50;
  }

  applyDifficulty() {
    this.health = Math.round(this.health * currentDifficulty.enemyHealthMult);
    this.maxHealth = Math.round(this.maxHealth * currentDifficulty.enemyHealthMult);
    this.damage = Math.round(this.damage * currentDifficulty.enemyDamageMult);
    this.speed = Math.round(this.speed * currentDifficulty.enemySpeedMult);
  }

  update(dt, player) {
    if (this.dead) return;

    // Update timers
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.state = 'stunned';
      this.vx *= 0.9;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'idle';
        this.aiState = 'retreat';
      }
      return;
    }

    // Face player
    this.facing = player.x < this.x ? -1 : 1;

    // AI behavior
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.runAI(dt, player, dx, dy, dist);

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Boundaries
    this.x = Math.max(this.width/2, Math.min(GAME_WIDTH - this.width/2, this.x));
    this.y = Math.max(PLAY_AREA_TOP, Math.min(PLAY_AREA_BOTTOM, this.y));

    // Animation
    this.animTimer += dt;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  runAI(dt, player, dx, dy, dist) {
    // Override in subclass
  }

  takeDamage(amount, knockbackDir) {
    this.health -= amount;
    this.stunTimer = 0.3;
    this.vx = knockbackDir * 150;

    playSound('enemyHit');
    spawnHitParticles(this.x, this.y - 30);
    spawnCodeFragments(this.x, this.y - 30);

    // Add to combo
    combo++;
    comboTimer = 2;
    if (combo > maxCombo) maxCombo = combo;

    score += 100 * combo;

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    playSound('enemyDefeat');
    spawnDefeatParticles(this.x, this.y - 30);
    score += 500;
    screenShake = 8;
    hitPause = 0.1;
  }

  draw(ctx) {
    // Override in subclass
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  getAttackHitbox() {
    if (this.state !== 'attack' || this.attackTimer < this.attackDuration * 0.3) {
      return null;
    }
    return {
      x: this.x + this.facing * 30,
      y: this.y - 25,
      width: 30,
      height: 30,
      damage: this.damage
    };
  }
}

// === DDOS DRONE ENEMY ===
class DDoSDrone extends Enemy {
  constructor(x, y) {
    super(x, y, 'drone');
  }

  setStats() {
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 5;
    this.speed = 90;
    this.attackRange = 45;
    this.attackDuration = 0.4;
  }

  runAI(dt, player, dx, dy, dist) {
    switch(this.aiState) {
      case 'approach':
        if (dist > this.attackRange) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed * 0.5;
          this.state = 'walk';
        } else if (this.attackCooldown <= 0) {
          this.aiState = 'attack';
        }
        break;

      case 'attack':
        this.vx = 0;
        this.vy = 0;
        this.state = 'attack';
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 1 + Math.random();
        this.aiState = 'approach';
        break;

      case 'retreat':
        this.vx = -(dx / dist) * this.speed * 0.5;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.state = 'walk';
        if (dist > 150 || Math.random() < 0.02) {
          this.aiState = 'approach';
        }
        break;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const bob = Math.sin(this.animFrame * Math.PI / 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hunched body
    ctx.fillStyle = ENEMY_COLORS.drone.hoodie;
    ctx.fillRect(-14, -45 + bob, 28, 35);

    // Hood
    ctx.fillStyle = ENEMY_COLORS.drone.hoodie;
    ctx.beginPath();
    ctx.arc(0, -50 + bob, 14, Math.PI, 0);
    ctx.fill();

    // Face (shadowed)
    ctx.fillStyle = '#333';
    ctx.fillRect(-8, -52 + bob, 16, 12);

    // Glowing eyes
    ctx.fillStyle = ENEMY_COLORS.drone.screen;
    ctx.fillRect(-6, -48 + bob, 4, 3);
    ctx.fillRect(2, -48 + bob, 4, 3);

    // Legs
    ctx.fillStyle = ENEMY_COLORS.drone.body;
    ctx.fillRect(-10, -12 + bob, 8, 12);
    ctx.fillRect(2, -12 + bob, 8, 12);

    // Feet
    ctx.fillStyle = '#222';
    ctx.fillRect(-12, -2, 10, 4);
    ctx.fillRect(2, -2, 10, 4);

    if (this.state === 'attack') {
      // Attacking pose - arms forward
      ctx.fillStyle = ENEMY_COLORS.drone.body;
      ctx.fillRect(10, -40 + bob, 20, 10);
      ctx.fillRect(10, -32 + bob, 20, 10);
    } else {
      // Laptop
      ctx.fillStyle = ENEMY_COLORS.drone.laptop;
      ctx.fillRect(8, -35 + bob, 18, 12);
      ctx.fillStyle = ENEMY_COLORS.drone.screen;
      ctx.fillRect(10, -33 + bob, 14, 8);

      // Screen flicker
      if (Math.random() > 0.9) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(12, -31 + bob, 10, 1);
      }
    }

    // Health bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#300';
      ctx.fillRect(-15, -60, 30, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(-15, -60, 30 * (this.health / this.maxHealth), 4);
    }

    ctx.restore();
  }
}

// === SQL INJECTOR ENEMY ===
class SQLInjector extends Enemy {
  constructor(x, y) {
    super(x, y, 'injector');
    this.projectiles = [];
  }

  setStats() {
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 10;
    this.speed = 60;
    this.attackRange = 250;
    this.preferredRange = 200;
    this.attackDuration = 0.6;
  }

  runAI(dt, player, dx, dy, dist) {
    switch(this.aiState) {
      case 'approach':
        if (dist > this.preferredRange) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed * 0.5;
          this.state = 'walk';
        } else if (dist < this.preferredRange - 50) {
          // Too close, back up
          this.vx = -(dx / dist) * this.speed;
          this.vy = 0;
          this.state = 'walk';
        } else if (this.attackCooldown <= 0) {
          this.aiState = 'attack';
        } else {
          this.vx = 0;
          this.vy = 0;
          this.state = 'idle';
        }
        break;

      case 'attack':
        this.vx = 0;
        this.vy = 0;
        this.state = 'attack';
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 1.5 + Math.random();

        // Fire projectile
        setTimeout(() => {
          if (!this.dead) {
            this.fireProjectile(player);
          }
        }, 200);

        this.aiState = 'retreat';
        break;

      case 'retreat':
        this.vx = -(dx / dist) * this.speed * 0.8;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.state = 'walk';
        if (dist > this.preferredRange || Math.random() < 0.03) {
          this.aiState = 'approach';
        }
        break;
    }
  }

  fireProjectile(player) {
    const dx = player.x - this.x;
    const dy = (player.y - 30) - (this.y - 30);
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.projectiles.push({
      x: this.x + this.facing * 20,
      y: this.y - 30,
      vx: (dx / dist) * 200,
      vy: (dy / dist) * 200,
      damage: this.damage,
      life: 3
    });

    playSound('punch');
  }

  updateProjectiles(dt, player) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Check collision with player
      if (Math.abs(p.x - player.x) < 25 && Math.abs(p.y - (player.y - 30)) < 30) {
        player.takeDamage(p.damage, p.vx > 0 ? 1 : -1);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Remove if expired or off screen
      if (p.life <= 0 || p.x < -50 || p.x > GAME_WIDTH + 50) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const bob = Math.sin(this.animFrame * Math.PI / 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowing cloak
    ctx.fillStyle = ENEMY_COLORS.injector.cloak;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-20, -50 + bob);
    ctx.lineTo(20, -50 + bob);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();

    // Hood
    ctx.fillStyle = ENEMY_COLORS.injector.hood;
    ctx.beginPath();
    ctx.arc(0, -52 + bob, 16, Math.PI, 0);
    ctx.lineTo(16, -45 + bob);
    ctx.lineTo(-16, -45 + bob);
    ctx.closePath();
    ctx.fill();

    // Dark face void
    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -54 + bob, 20, 14);

    // Glowing purple eyes
    ctx.fillStyle = ENEMY_COLORS.injector.glow;
    ctx.shadowColor = ENEMY_COLORS.injector.glow;
    ctx.shadowBlur = 10;
    ctx.fillRect(-7, -50 + bob, 5, 4);
    ctx.fillRect(2, -50 + bob, 5, 4);
    ctx.shadowBlur = 0;

    if (this.state === 'attack') {
      // Casting pose
      ctx.fillStyle = ENEMY_COLORS.injector.cloak;
      ctx.fillRect(12, -45 + bob, 25, 10);

      // Magic glow
      ctx.fillStyle = ENEMY_COLORS.injector.glow;
      ctx.shadowColor = ENEMY_COLORS.injector.glow;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(35, -40 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Arms at sides
      ctx.fillStyle = ENEMY_COLORS.injector.cloak;
      ctx.fillRect(14, -40 + bob, 8, 25);
    }

    // Health bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = '#300';
      ctx.fillRect(-15, -72, 30, 4);
      ctx.fillStyle = '#f0f';
      ctx.fillRect(-15, -72, 30 * (this.health / this.maxHealth), 4);
    }

    ctx.restore();

    // Draw projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = ENEMY_COLORS.injector.glow;
      ctx.shadowColor = ENEMY_COLORS.injector.glow;
      ctx.shadowBlur = 10;

      // SQL query projectile
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '10px Courier New';
      ctx.fillStyle = '#fff';
      ctx.fillText('SQL', p.x - 10, p.y + 3);

      ctx.shadowBlur = 0;
    });
  }

  getAttackHitbox() {
    return null; // Uses projectiles instead
  }
}

// === ZERO DAY BOSS ===
class ZeroDayBoss extends Enemy {
  constructor(x, y) {
    super(x, y, 'boss');
    this.phase = 1;
    this.teleportTimer = 0;
    this.attackPattern = 0;
  }

  setStats() {
    this.health = 200;
    this.maxHealth = 200;
    this.damage = 20;
    this.speed = 70;
    this.attackRange = 60;
    this.attackDuration = 0.6;
    this.width = 60;
    this.height = 80;
  }

  runAI(dt, player, dx, dy, dist) {
    // Phase 2 at 50% health
    if (this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.speed = 100;
      screenShake = 15;
      playSound('special');
      spawnDefeatParticles(this.x, this.y - 40);
    }

    // Phase 2: occasional teleport
    if (this.phase === 2) {
      this.teleportTimer -= dt;
      if (this.teleportTimer <= 0) {
        this.teleport(player);
        this.teleportTimer = 3 + Math.random() * 2;
      }
    }

    switch(this.aiState) {
      case 'approach':
        if (dist > this.attackRange) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed * 0.5;
          this.state = 'walk';
        } else if (this.attackCooldown <= 0) {
          this.aiState = 'attack';
        }
        break;

      case 'attack':
        this.vx = 0;
        this.vy = 0;
        this.state = 'attack';
        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.phase === 1 ? 1.5 : 0.8;
        this.aiState = 'retreat';
        playSound('kick');
        break;

      case 'retreat':
        this.vx = -(dx / dist) * this.speed * 0.3;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.state = 'walk';
        if (dist > 120 || Math.random() < 0.05) {
          this.aiState = 'approach';
        }
        break;
    }
  }

  teleport(player) {
    // Teleport to random position near player
    spawnDefeatParticles(this.x, this.y - 40);

    const side = Math.random() > 0.5 ? 1 : -1;
    this.x = player.x + side * (100 + Math.random() * 100);
    this.y = player.y + (Math.random() - 0.5) * 100;

    // Clamp to bounds
    this.x = Math.max(60, Math.min(GAME_WIDTH - 60, this.x));
    this.y = Math.max(PLAY_AREA_TOP, Math.min(PLAY_AREA_BOTTOM, this.y));

    spawnHitParticles(this.x, this.y - 40, COLORS.neonPink);
    playSound('special');
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    const bob = Math.sin(this.animFrame * Math.PI / 2) * 3;
    const phaseGlow = this.phase === 2 ? Math.sin(Date.now() / 100) * 0.3 + 0.7 : 0;

    // Phase 2 aura
    if (this.phase === 2) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + phaseGlow * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(0, -40, 50 + phaseGlow * 10, 45 + phaseGlow * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cape
    ctx.fillStyle = ENEMY_COLORS.boss.cape;
    ctx.beginPath();
    ctx.moveTo(-25, -60 + bob);
    ctx.lineTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(25, -60 + bob);
    ctx.closePath();
    ctx.fill();

    // Armored body
    ctx.fillStyle = ENEMY_COLORS.boss.armor;
    ctx.fillRect(-22, -65 + bob, 44, 50);

    // Armor trim
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.fillRect(-22, -65 + bob, 44, 5);
    ctx.fillRect(-22, -65 + bob, 5, 50);
    ctx.fillRect(13, -65 + bob, 5, 50);
    ctx.fillRect(-10, -50 + bob, 20, 3);

    // Belt with skull
    ctx.fillStyle = '#222';
    ctx.fillRect(-20, -20 + bob, 40, 8);
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.fillRect(-8, -22 + bob, 16, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -18 + bob, 8, 6);

    // Legs
    ctx.fillStyle = ENEMY_COLORS.boss.armor;
    ctx.fillRect(-18, -15 + bob, 14, 15);
    ctx.fillRect(4, -15 + bob, 14, 15);

    // Boots
    ctx.fillStyle = '#222';
    ctx.fillRect(-20, -4, 16, 6);
    ctx.fillRect(4, -4, 16, 6);
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.fillRect(-20, -4, 16, 2);
    ctx.fillRect(4, -4, 16, 2);

    // Shoulder armor
    ctx.fillStyle = ENEMY_COLORS.boss.armor;
    ctx.fillRect(-32, -62 + bob, 14, 18);
    ctx.fillRect(18, -62 + bob, 14, 18);
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.fillRect(-32, -62 + bob, 14, 3);
    ctx.fillRect(18, -62 + bob, 14, 3);

    if (this.state === 'attack') {
      // Attack pose
      ctx.fillStyle = ENEMY_COLORS.boss.armor;
      ctx.fillRect(20, -55 + bob, 30, 14);
      ctx.fillStyle = ENEMY_COLORS.boss.trim;
      ctx.fillRect(45, -58 + bob, 12, 20);
    } else {
      // Arms at rest
      ctx.fillStyle = ENEMY_COLORS.boss.armor;
      ctx.fillRect(-35, -50 + bob, 10, 30);
      ctx.fillRect(25, -50 + bob, 10, 30);
      ctx.fillStyle = ENEMY_COLORS.boss.trim;
      ctx.fillRect(-37, -22 + bob, 14, 8);
      ctx.fillRect(23, -22 + bob, 14, 8);
    }

    // Helmet
    ctx.fillStyle = ENEMY_COLORS.boss.armor;
    ctx.fillRect(-16, -90 + bob, 32, 28);
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.fillRect(-18, -92 + bob, 36, 5);
    ctx.fillRect(-18, -92 + bob, 5, 30);
    ctx.fillRect(13, -92 + bob, 5, 30);

    // Visor
    ctx.fillStyle = '#000';
    ctx.fillRect(-12, -82 + bob, 24, 12);

    // Glowing eyes
    ctx.fillStyle = ENEMY_COLORS.boss.eyes;
    ctx.shadowColor = ENEMY_COLORS.boss.eyes;
    ctx.shadowBlur = this.phase === 2 ? 15 : 8;
    ctx.fillRect(-9, -79 + bob, 7, 5);
    ctx.fillRect(2, -79 + bob, 7, 5);
    ctx.shadowBlur = 0;

    // Helmet crest
    ctx.fillStyle = ENEMY_COLORS.boss.trim;
    ctx.beginPath();
    ctx.moveTo(0, -95 + bob);
    ctx.lineTo(-8, -85 + bob);
    ctx.lineTo(8, -85 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Health bar (larger for boss)
    ctx.fillStyle = '#300';
    ctx.fillRect(this.x - 40, this.y - 110, 80, 8);
    ctx.fillStyle = this.phase === 2 ? '#f00' : '#0f0';
    ctx.fillRect(this.x - 40, this.y - 110, 80 * (this.health / this.maxHealth), 8);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x - 40, this.y - 110, 80, 8);

    // Boss name
    ctx.font = '12px Courier New';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('ZERO DAY', this.x, this.y - 118);
    ctx.textAlign = 'left';
  }

  getAttackHitbox() {
    if (this.state !== 'attack' || this.attackTimer < this.attackDuration * 0.3) {
      return null;
    }
    return {
      x: this.x + this.facing * 40,
      y: this.y - 35,
      width: 50,
      height: 50,
      damage: this.damage
    };
  }

  die() {
    super.die();
    score += 2000;
    // Victory is handled in wave manager
  }
}

// === WAVE MANAGER ===
const waves = [
  { enemies: [
    { type: 'drone', count: 4 }
  ], message: ['WAVE 1', 'INCOMING PACKETS'] },
  { enemies: [
    { type: 'drone', count: 3 },
    { type: 'injector', count: 2 }
  ], message: ['WAVE 2', 'MALICIOUS QUERIES DETECTED'] },
  { enemies: [
    { type: 'drone', count: 4 },
    { type: 'injector', count: 3 }
  ], message: ['WAVE 3', 'BREACH ATTEMPT IN PROGRESS'] },
  { enemies: [
    { type: 'boss', count: 1 }
  ], message: ['FINAL WAVE', 'ROOT_CAUSE LEADER DETECTED'] }
];

let currentWave = 0;
let enemies = [];
let waveComplete = false;

function startWave(waveNum) {
  currentWave = waveNum;
  waveComplete = false;
  enemies = [];

  const wave = waves[waveNum];

  wave.enemies.forEach(spawn => {
    // Apply enemy count multiplier (but not for bosses)
    const count = spawn.type === 'boss'
      ? spawn.count
      : Math.round(spawn.count * currentDifficulty.enemyCountMult);

    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? -1 : 1;
      const x = side === -1 ? -50 : GAME_WIDTH + 50;
      const y = PLAY_AREA_TOP + Math.random() * (PLAY_AREA_BOTTOM - PLAY_AREA_TOP);

      let enemy;
      switch(spawn.type) {
        case 'drone':
          enemy = new DDoSDrone(x, y);
          break;
        case 'injector':
          enemy = new SQLInjector(x, y);
          break;
        case 'boss':
          enemy = new ZeroDayBoss(GAME_WIDTH + 80, GROUND_Y);
          break;
      }

      // Stagger entry
      enemy.x = x - side * (i * 30);
      enemies.push(enemy);
    }
  });

  gameState = STATE.WAVE_INTRO;
  waveIntroTimer = 2;
  playSound('waveStart');
}

function updateWaves() {
  if (waveComplete) return;

  // Check if all enemies are dead
  const aliveEnemies = enemies.filter(e => !e.dead);
  if (aliveEnemies.length === 0) {
    waveComplete = true;

    if (currentWave >= waves.length - 1) {
      // Victory!
      gameState = STATE.VICTORY;
      playSound('victory');
    } else {
      // Next wave after delay
      setTimeout(() => {
        if (gameState === STATE.PLAYING) {
          startWave(currentWave + 1);
        }
      }, 2000);
    }
  }
}

// === COLLISION DETECTION ===
function checkAABB(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
         Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

function handleCombat(player) {
  // Player attacks hitting enemies
  if (player.attackHitbox) {
    enemies.forEach(enemy => {
      if (enemy.dead) return;
      if (player.hasHitThisAttack.includes(enemy)) return;

      const enemyBox = enemy.getHitbox();
      if (checkAABB(player.attackHitbox, enemyBox)) {
        // Check z-depth (y position proximity)
        if (Math.abs(player.y - enemy.y) < 40) {
          const knockbackDir = player.facing;
          enemy.takeDamage(player.attackHitbox.damage, knockbackDir);
          player.hasHitThisAttack.push(enemy);

          if (player.attackHitbox.isSpecial) {
            screenShake = 12;
            hitPause = 0.08;
          } else {
            hitPause = 0.05;
          }
        }
      }
    });
  }

  // Enemy attacks hitting player
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    const attackBox = enemy.getAttackHitbox();
    if (attackBox) {
      const playerBox = {
        x: player.x,
        y: player.y - 30,
        width: player.width,
        height: player.height
      };

      if (checkAABB(attackBox, playerBox)) {
        if (Math.abs(player.y - enemy.y) < 40) {
          const knockbackDir = enemy.facing;
          player.takeDamage(attackBox.damage, knockbackDir);
        }
      }
    }
  });
}

// === BACKGROUND RENDERING ===
function drawBackground(ctx) {
  // Floor
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, PLAY_AREA_TOP - 50, GAME_WIDTH, GAME_HEIGHT - PLAY_AREA_TOP + 50);

  // Raised floor grid
  ctx.strokeStyle = COLORS.floorGrid;
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, PLAY_AREA_TOP - 50);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
  }
  for (let y = PLAY_AREA_TOP - 50; y < GAME_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }

  // Back wall
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, GAME_WIDTH, PLAY_AREA_TOP - 50);

  // Server racks
  for (let i = 0; i < 8; i++) {
    drawServerRack(ctx, 50 + i * 100, PLAY_AREA_TOP - 150);
  }

  // Ceiling cables
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  for (let x = 30; x < GAME_WIDTH; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 30, 30, x + 60, 0);
    ctx.stroke();
  }
}

function drawServerRack(ctx, x, y) {
  // Rack frame
  ctx.fillStyle = COLORS.serverRack;
  ctx.fillRect(x, y, 80, 150);

  // Server units
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(x + 5, y + 10 + i * 23, 70, 20);

    // Blinking LEDs
    for (let j = 0; j < 4; j++) {
      const isOn = Math.random() > 0.3;
      ctx.fillStyle = isOn ? COLORS.serverLight : COLORS.serverLightOff;
      ctx.fillRect(x + 10 + j * 8, y + 15 + i * 23, 4, 4);
    }

    // Ventilation
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(x + 50, y + 12 + i * 23, 20, 16);
  }

  // Rack trim
  ctx.strokeStyle = '#4a4a6e';
  ctx.strokeRect(x, y, 80, 150);
}

// === HUD RENDERING ===
function drawHUD(ctx, player) {
  // Health bar
  ctx.fillStyle = '#000';
  ctx.fillRect(18, 18, 204, 24);
  ctx.fillStyle = COLORS.healthBarBg;
  ctx.fillRect(20, 20, 200, 20);
  ctx.fillStyle = COLORS.healthBar;
  ctx.fillRect(20, 20, 200 * (player.health / player.maxHealth), 20);
  ctx.strokeStyle = COLORS.neonCyan;
  ctx.strokeRect(20, 20, 200, 20);

  ctx.font = '14px Courier New';
  ctx.fillStyle = '#fff';
  ctx.fillText('BANDWIDTH', 25, 35);

  // Special cooldown
  if (player.specialCooldown > 0) {
    ctx.fillStyle = '#666';
    ctx.fillText(`FORCE QUIT: ${player.specialCooldown.toFixed(1)}s`, 20, 55);
  } else {
    ctx.fillStyle = COLORS.neonPink;
    ctx.fillText('FORCE QUIT: READY [C]', 20, 55);
  }

  // Score
  ctx.fillStyle = COLORS.neonCyan;
  ctx.textAlign = 'right';
  ctx.fillText(`PACKETS SECURED: ${score}`, GAME_WIDTH - 20, 35);

  // Wave indicator
  ctx.fillText(`WAVE ${currentWave + 1}/${waves.length}`, GAME_WIDTH - 20, 55);

  // Difficulty indicator
  ctx.font = '10px Courier New';
  ctx.fillStyle = '#666';
  ctx.fillText(`[${currentDifficulty.name}]`, GAME_WIDTH - 20, 70);
  ctx.font = '14px Courier New';

  // Combo
  if (combo > 1) {
    ctx.font = '24px Courier New';
    ctx.fillStyle = COLORS.neonPink;
    ctx.textAlign = 'center';
    const comboScale = 1 + Math.sin(Date.now() / 100) * 0.1;
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 100);
    ctx.scale(comboScale, comboScale);
    ctx.fillText(`${combo}x COMBO!`, 0, 0);
    ctx.restore();
  }

  ctx.textAlign = 'left';
}

// === GAME STATE SCREENS ===
function drawMenuScreen(ctx) {
  drawBackground(ctx);

  // Darken
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Title
  ctx.font = '64px Courier New';
  ctx.textAlign = 'center';

  // Title glow
  ctx.shadowColor = COLORS.neonCyan;
  ctx.shadowBlur = 20;
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillText('FIREWALL', GAME_WIDTH / 2, 180);
  ctx.fillStyle = COLORS.neonPink;
  ctx.shadowColor = COLORS.neonPink;
  ctx.fillText('FIST', GAME_WIDTH / 2, 250);
  ctx.shadowBlur = 0;

  // Tagline
  ctx.font = '18px Courier New';
  ctx.fillStyle = '#fff';
  ctx.fillText('The Way of the Thousand Packets', GAME_WIDTH / 2, 300);

  // Story
  ctx.font = '14px Courier New';
  ctx.fillStyle = '#aaa';
  ctx.fillText('IT engineer LEE must defend the data centre', GAME_WIDTH / 2, 350);
  ctx.fillText('against the ROOT_CAUSE hacking collective', GAME_WIDTH / 2, 370);

  // Controls
  ctx.font = '12px Courier New';
  ctx.fillStyle = '#888';
  ctx.fillText('WASD/Arrows: Move | Z: Punch | X: Kick | C: Special', GAME_WIDTH / 2, 420);

  // Start prompt (blinking)
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.font = '24px Courier New';
    ctx.fillStyle = COLORS.neonGreen;
    ctx.fillText('PRESS SPACE TO START', GAME_WIDTH / 2, 500);
  }

  ctx.textAlign = 'left';
}

function drawDifficultySelect(ctx) {
  drawBackground(ctx);

  // Darken
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';

  // Title
  ctx.font = '36px Courier New';
  ctx.fillStyle = COLORS.neonCyan;
  ctx.shadowColor = COLORS.neonCyan;
  ctx.shadowBlur = 15;
  ctx.fillText('SELECT ACCESS LEVEL', GAME_WIDTH / 2, 100);
  ctx.shadowBlur = 0;

  // Difficulty options
  const startY = 180;
  const spacing = 120;

  DIFFICULTIES.forEach((diff, i) => {
    const y = startY + i * spacing;
    const isSelected = i === selectedDifficulty;

    // Selection box
    if (isSelected) {
      ctx.strokeStyle = COLORS.neonPink;
      ctx.shadowColor = COLORS.neonPink;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.strokeRect(GAME_WIDTH / 2 - 200, y - 35, 400, 90);
      ctx.shadowBlur = 0;

      // Animated arrows
      const arrowOffset = Math.sin(Date.now() / 200) * 5;
      ctx.font = '24px Courier New';
      ctx.fillStyle = COLORS.neonPink;
      ctx.fillText('>', GAME_WIDTH / 2 - 220 - arrowOffset, y + 5);
      ctx.fillText('<', GAME_WIDTH / 2 + 220 + arrowOffset, y + 5);
    }

    // Difficulty name
    ctx.font = '28px Courier New';
    ctx.fillStyle = isSelected ? COLORS.neonGreen : '#666';
    if (isSelected) {
      ctx.shadowColor = COLORS.neonGreen;
      ctx.shadowBlur = 10;
    }
    ctx.fillText(diff.name, GAME_WIDTH / 2, y);
    ctx.shadowBlur = 0;

    // Description
    ctx.font = '14px Courier New';
    ctx.fillStyle = isSelected ? '#aaa' : '#444';
    ctx.fillText(diff.description, GAME_WIDTH / 2, y + 30);

    // Stats preview
    if (isSelected) {
      ctx.font = '12px Courier New';
      ctx.fillStyle = '#888';
      const stats = `HP x${diff.enemyHealthMult} | DMG x${diff.enemyDamageMult} | SPD x${diff.enemySpeedMult}`;
      ctx.fillText(stats, GAME_WIDTH / 2, y + 50);
    }
  });

  // Controls
  ctx.font = '16px Courier New';
  ctx.fillStyle = '#888';
  ctx.fillText('W/S or UP/DOWN to select', GAME_WIDTH / 2, 540);

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.font = '20px Courier New';
    ctx.fillStyle = COLORS.neonGreen;
    ctx.fillText('PRESS SPACE TO CONFIRM', GAME_WIDTH / 2, 570);
  }

  ctx.textAlign = 'left';
}

function drawWaveIntro(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.shadowColor = COLORS.neonCyan;
  ctx.shadowBlur = 15;

  const message = waves[currentWave].message;
  if (Array.isArray(message)) {
    ctx.font = '42px Courier New';
    ctx.fillStyle = COLORS.neonCyan;
    ctx.fillText(message[0], GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25);
    ctx.font = '28px Courier New';
    ctx.fillStyle = COLORS.neonPink;
    ctx.shadowColor = COLORS.neonPink;
    ctx.fillText(message[1], GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  } else {
    ctx.font = '36px Courier New';
    ctx.fillStyle = COLORS.neonCyan;
    ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function drawGameOverScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.fillText('CONNECTION', GAME_WIDTH / 2, 200);
  ctx.fillText('TERMINATED', GAME_WIDTH / 2, 260);
  ctx.shadowBlur = 0;

  ctx.font = '24px Courier New';
  ctx.fillStyle = '#fff';
  ctx.fillText(`FINAL SCORE: ${score}`, GAME_WIDTH / 2, 340);
  ctx.fillText(`MAX COMBO: ${maxCombo}x`, GAME_WIDTH / 2, 380);
  ctx.fillText(`WAVES CLEARED: ${currentWave}/${waves.length}`, GAME_WIDTH / 2, 420);

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = COLORS.neonPink;
    ctx.fillText('PRESS SPACE TO RETRY', GAME_WIDTH / 2, 500);
  }

  ctx.textAlign = 'left';
}

function drawVictoryScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 20;
  ctx.fillText('FIREWALL', GAME_WIDTH / 2, 180);
  ctx.fillText('SECURED', GAME_WIDTH / 2, 240);
  ctx.shadowBlur = 0;

  ctx.font = '20px Courier New';
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillText('ROOT_CAUSE NEUTRALISED', GAME_WIDTH / 2, 300);

  ctx.font = '24px Courier New';
  ctx.fillStyle = '#fff';
  ctx.fillText(`FINAL SCORE: ${score}`, GAME_WIDTH / 2, 370);
  ctx.fillText(`MAX COMBO: ${maxCombo}x`, GAME_WIDTH / 2, 410);

  ctx.font = '16px Courier New';
  ctx.fillStyle = '#aaa';
  ctx.fillText('The data centre is safe... for now.', GAME_WIDTH / 2, 470);

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = COLORS.neonPink;
    ctx.font = '20px Courier New';
    ctx.fillText('PRESS SPACE TO PLAY AGAIN', GAME_WIDTH / 2, 540);
  }

  ctx.textAlign = 'left';
}

function drawPausedScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.neonCyan;
  ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);

  ctx.font = '20px Courier New';
  ctx.fillStyle = '#fff';
  ctx.fillText('Press ENTER to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  ctx.textAlign = 'left';
}

// === MAIN GAME LOOP ===
let player;

function resetGame() {
  player = new Player();
  enemies = [];
  particles.length = 0;
  codeFragments.length = 0;
  score = 0;
  combo = 0;
  comboTimer = 0;
  maxCombo = 0;
  currentWave = 0;
  screenShake = 0;
  hitPause = 0;
  startWave(0);
}

function update(dt) {
  // Handle hit pause
  if (hitPause > 0) {
    hitPause -= dt;
    return;
  }

  // Combo timer
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 0;
    }
  }

  // Screen shake decay
  if (screenShake > 0) {
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }

  // Update based on state
  switch (gameState) {
    case STATE.MENU:
      if (justPressed(['Space'])) {
        initAudio();
        playSound('menuSelect');
        gameState = STATE.DIFFICULTY_SELECT;
      }
      break;

    case STATE.DIFFICULTY_SELECT:
      if (justPressed(['KeyW', 'ArrowUp'])) {
        selectedDifficulty = (selectedDifficulty - 1 + DIFFICULTIES.length) % DIFFICULTIES.length;
        playSound('menuSelect');
      }
      if (justPressed(['KeyS', 'ArrowDown'])) {
        selectedDifficulty = (selectedDifficulty + 1) % DIFFICULTIES.length;
        playSound('menuSelect');
      }
      if (justPressed(['Space', 'Enter'])) {
        currentDifficulty = DIFFICULTIES[selectedDifficulty];
        playSound('waveStart');
        resetGame();
      }
      if (justPressed(['Escape'])) {
        gameState = STATE.MENU;
        playSound('menuSelect');
      }
      break;

    case STATE.WAVE_INTRO:
      waveIntroTimer -= dt;
      if (waveIntroTimer <= 0) {
        gameState = STATE.PLAYING;
      }
      // Still update player movement during intro
      player.update(dt);
      break;

    case STATE.PLAYING:
      player.update(dt);

      enemies.forEach(enemy => {
        enemy.update(dt, player);
        if (enemy.type === 'injector') {
          enemy.updateProjectiles(dt, player);
        }
      });

      handleCombat(player);
      updateWaves();
      updateParticles(dt);

      if (justPressed(['Enter'])) {
        gameState = STATE.PAUSED;
      }
      break;

    case STATE.PAUSED:
      if (justPressed(['Enter'])) {
        gameState = STATE.PLAYING;
      }
      break;

    case STATE.GAME_OVER:
    case STATE.VICTORY:
      updateParticles(dt);
      if (justPressed(['Space'])) {
        playSound('menuSelect');
        resetGame();
      }
      break;
  }
}

function render() {
  // Apply screen shake
  ctx.save();
  if (screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
  }

  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  switch (gameState) {
    case STATE.MENU:
      drawMenuScreen(ctx);
      break;

    case STATE.DIFFICULTY_SELECT:
      drawDifficultySelect(ctx);
      break;

    case STATE.WAVE_INTRO:
      drawBackground(ctx);
      player.draw(ctx);
      enemies.forEach(e => e.draw(ctx));
      drawParticles(ctx);
      drawHUD(ctx, player);
      drawWaveIntro(ctx);
      break;

    case STATE.PLAYING:
      drawBackground(ctx);

      // Sort entities by y for proper depth
      const entities = [player, ...enemies.filter(e => !e.dead)];
      entities.sort((a, b) => a.y - b.y);
      entities.forEach(e => e.draw(ctx));

      drawParticles(ctx);
      drawHUD(ctx, player);
      break;

    case STATE.PAUSED:
      drawBackground(ctx);
      player.draw(ctx);
      enemies.forEach(e => e.draw(ctx));
      drawHUD(ctx, player);
      drawPausedScreen(ctx);
      break;

    case STATE.GAME_OVER:
      drawBackground(ctx);
      drawParticles(ctx);
      drawGameOverScreen(ctx);
      break;

    case STATE.VICTORY:
      drawBackground(ctx);
      drawParticles(ctx);
      drawVictoryScreen(ctx);
      break;
  }

  ctx.restore();
}

function gameLoop(timestamp) {
  // Calculate delta time
  deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(deltaTime);
  render();
  clearJustPressed();

  requestAnimationFrame(gameLoop);
}

// === INITIALISATION ===
function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  // Responsive scaling
  function resize() {
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    // Use integer scaling for pixel-perfect rendering when possible
    const intScale = Math.max(1, Math.floor(scale));
    const finalScale = scale < 1 ? scale : (scale - intScale < 0.5 ? intScale : scale);

    canvas.style.width = (GAME_WIDTH * finalScale) + 'px';
    canvas.style.height = (GAME_HEIGHT * finalScale) + 'px';

    const overlay = document.getElementById('crt-overlay');
    overlay.style.width = (GAME_WIDTH * finalScale) + 'px';
    overlay.style.height = (GAME_HEIGHT * finalScale) + 'px';
  }

  window.addEventListener('resize', resize);
  resize();

  setupInput();

  player = new Player();

  requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
