const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

const keys = new Set();
const GRAVITY = 0.55;
const TILE = 48;
const WORLD_WIDTH = 3200;

const player = {
  x: 100,
  y: 0,
  w: 36,
  h: 46,
  vx: 0,
  vy: 0,
  speed: 5,
  jumpPower: -12,
  grounded: false,
  score: 0,
  lives: 3,
};

const levelPlatforms = [
  { x: 0, y: 500, w: WORLD_WIDTH, h: 40 },
  { x: 260, y: 420, w: 180, h: 24 },
  { x: 520, y: 360, w: 160, h: 24 },
  { x: 760, y: 300, w: 200, h: 24 },
  { x: 1090, y: 380, w: 180, h: 24 },
  { x: 1400, y: 430, w: 200, h: 24 },
  { x: 1730, y: 360, w: 200, h: 24 },
  { x: 2050, y: 290, w: 180, h: 24 },
  { x: 2340, y: 380, w: 200, h: 24 },
  { x: 2650, y: 320, w: 160, h: 24 },
];

const coins = [
  320, 400, 580, 630, 850, 900, 1160, 1470, 1510, 1790, 2110, 2410, 2700,
].map((x, i) => ({ x, y: 250 + (i % 3) * 32, collected: false }));

const enemies = [
  { x: 620, y: 470, w: 34, h: 28, vx: 1.3, minX: 520, maxX: 700, alive: true },
  { x: 1200, y: 350, w: 34, h: 28, vx: 1.1, minX: 1090, maxX: 1270, alive: true },
  { x: 1840, y: 330, w: 34, h: 28, vx: 1.4, minX: 1730, maxX: 1930, alive: true },
  { x: 2430, y: 350, w: 34, h: 28, vx: 1.2, minX: 2340, maxX: 2530, alive: true },
];

const goal = { x: 3040, y: 390, w: 22, h: 110 };
let cameraX = 0;
let won = false;

function resetPlayerPosition() {
  player.x = 100;
  player.y = 220;
  player.vx = 0;
  player.vy = 0;
}

function resetGame(fullReset = false) {
  resetPlayerPosition();
  if (fullReset) {
    player.score = 0;
    player.lives = 3;
    coins.forEach((coin) => (coin.collected = false));
    enemies.forEach((enemy) => (enemy.alive = true));
  }
  won = false;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (won) return;

  player.vx = 0;
  if (keys.has('ArrowLeft')) player.vx = -player.speed;
  if (keys.has('ArrowRight')) player.vx = player.speed;

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  for (const p of levelPlatforms) {
    if (!intersects(player, p)) continue;

    const prevBottom = player.y + player.h - player.vy;
    const prevTop = player.y - player.vy;

    if (prevBottom <= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    } else if (prevTop >= p.y + p.h) {
      player.y = p.y + p.h;
      player.vy = 0.5;
    } else if (player.vx > 0) {
      player.x = p.x - player.w;
    } else if (player.vx < 0) {
      player.x = p.x + p.w;
    }
  }

  if (player.y > canvas.height + 120) {
    player.lives -= 1;
    if (player.lives <= 0) resetGame(true);
    else resetPlayerPosition();
  }

  for (const coin of coins) {
    if (!coin.collected && intersects(player, { x: coin.x, y: coin.y, w: 20, h: 20 })) {
      coin.collected = true;
      player.score += 100;
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) enemy.vx *= -1;

    if (intersects(player, enemy)) {
      const stomped = player.vy > 0 && player.y + player.h - enemy.y < 22;
      if (stomped) {
        enemy.alive = false;
        player.vy = -8;
        player.score += 250;
      } else {
        player.lives -= 1;
        if (player.lives <= 0) resetGame(true);
        else resetPlayerPosition();
      }
    }
  }

  if (intersects(player, goal)) {
    won = true;
    player.score += 1000;
  }

  player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.w));
  cameraX = Math.max(0, Math.min(player.x - canvas.width * 0.35, WORLD_WIDTH - canvas.width));
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - cameraX, y, w, h);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#74c7ff');
  sky.addColorStop(1, '#bde9ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  levelPlatforms.forEach((p) => drawRect(p.x, p.y, p.w, p.h, p.y > 450 ? '#4f8b34' : '#7f5430'));

  for (const coin of coins) {
    if (coin.collected) continue;
    ctx.fillStyle = '#ffd400';
    ctx.beginPath();
    ctx.arc(coin.x + 10 - cameraX, coin.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bc9a00';
    ctx.stroke();
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    drawRect(enemy.x, enemy.y, enemy.w, enemy.h, '#8b2f2f');
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.x + 6 - cameraX, enemy.y + 7, 6, 6);
    ctx.fillRect(enemy.x + 22 - cameraX, enemy.y + 7, 6, 6);
  }

  drawRect(goal.x, goal.y, goal.w, goal.h, '#efefef');
  drawRect(goal.x - 28, goal.y + 3, 28, 18, '#f14d4d');

  drawRect(player.x, player.y, player.w, player.h, '#ff5656');
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x + 7 - cameraX, player.y + 9, 6, 6);
  ctx.fillRect(player.x + 22 - cameraX, player.y + 9, 6, 6);

  hud.textContent = won
    ? `클리어! 점수: ${player.score} (R로 다시 시작)`
    : `점수: ${player.score} | 목숨: ${player.lives}`;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (player.grounded && !won) {
      player.vy = player.jumpPower;
      player.grounded = false;
    }
  }

  if (event.code === 'KeyR') {
    resetGame(true);
  }

  keys.add(event.key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key);
});

resetGame(true);
loop();
