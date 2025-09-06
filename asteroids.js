// Asteroids Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let keys = {};
let gameStarted = false;

function randBetween(a, b) { return a + Math.random() * (b - a); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function wrap(p, max) { return (p + max) % max; }

class Ship {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.angle = -Math.PI / 2;
    this.radius = 15;
    this.vel = [0, 0];
    this.thrust = false;
    this.bullets = [];
    this.dead = false;
    this.invulnerable = 0;
    this.lives = 3;
    this.score = 0;
  }
  update() {
    if (this.thrust) {
      this.vel[0] += 0.12 * Math.cos(this.angle);
      this.vel[1] += 0.12 * Math.sin(this.angle);
    }
    this.vel[0] *= 0.99;
    this.vel[1] *= 0.99;
    this.x = wrap(this.x + this.vel[0], canvas.width);
    this.y = wrap(this.y + this.vel[1], canvas.height);
    for (let b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => b.life > 0);
    if (this.invulnerable > 0) this.invulnerable--;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = (this.invulnerable % 10 > 5) ? '#ff0' : '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.8, -this.radius * 0.6);
    ctx.lineTo(-this.radius * 0.8, this.radius * 0.6);
    ctx.closePath();
    ctx.stroke();
    if (this.thrust) {
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.8, 0);
      ctx.lineTo(-this.radius - 8, 0);
      ctx.stroke();
    }
    ctx.restore();
    for (let b of this.bullets) b.draw();
  }
  shoot() {
    if (this.bullets.length > 5) return;
    this.bullets.push(new Bullet(this.x, this.y, this.angle));
  }
  hyperspace() {
    this.x = randBetween(0, canvas.width);
    this.y = randBetween(0, canvas.height);
    if (Math.random() < 1 / 6) this.dead = true;
  }
  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.vel = [0, 0];
    this.angle = -Math.PI / 2;
    this.invulnerable = 120;
    this.dead = false;
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.dx = 6 * Math.cos(angle);
    this.dy = 6 * Math.sin(angle);
    this.life = 60;
    this.radius = 2;
  }
  update() {
    this.x = wrap(this.x + this.dx, canvas.width);
    this.y = wrap(this.y + this.dy, canvas.height);
    this.life--;
  }
  draw() {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

class Asteroid {
  constructor(x, y, r, dx, dy, gen = 1) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.dx = dx;
    this.dy = dy;
    this.gen = gen;
    this.points = [];
    let verts = Math.floor(randBetween(8, 14));
    for (let i = 0; i < verts; ++i) {
      let a = (Math.PI * 2 / verts) * i;
      let rad = this.r * randBetween(0.8, 1.2);
      this.points.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
  }
  update() {
    this.x = wrap(this.x + this.dx, canvas.width);
    this.y = wrap(this.y + this.dy, canvas.height);
  }
  draw() {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.translate(this.x, this.y);
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    for (let p of this.points) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function spawnAsteroids(num) {
  let asteroids = [];
  for (let i = 0; i < num; ++i) {
    let edge = Math.floor(randBetween(0, 4));
    let x = edge < 2 ? randBetween(0, canvas.width) : (edge == 2 ? 0 : canvas.width);
    let y = edge > 1 ? randBetween(0, canvas.height) : (edge == 0 ? 0 : canvas.height);
    let r = randBetween(32, 50);
    let dx = randBetween(-2, 2);
    let dy = randBetween(-2, 2);
    asteroids.push(new Asteroid(x, y, r, dx, dy, 1));
  }
  return asteroids;
}

const game = {
  ship: new Ship(),
  asteroids: [],
  level: 1,
  state: 'start',
  start() {
    this.ship = new Ship();
    this.asteroids = spawnAsteroids(4);
    this.level = 1;
    this.state = 'playing';
    document.getElementById("instructions").style.display = 'none';
  },
  nextLevel() {
    this.level++;
    this.asteroids = spawnAsteroids(3 + this.level);
  },
  loseLife() {
    this.ship.lives--;
    if (this.ship.lives > 0) {
      this.ship.reset();
    } else {
      this.state = 'gameover';
      setTimeout(() => {
        document.getElementById("instructions").style.display = '';
      }, 1200);
    }
  }
};

function startGame() {
  game.start();
}

window.startGame = startGame;

function drawUI() {
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "20px monospace";
  ctx.fillText(`Score: ${game.ship.score}`, 20, 30);
  ctx.fillText(`Lives: ${game.ship.lives}`, 20, 60);
  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (game.state === "start" || game.state === "gameover") {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ASTEROIDS", canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = "24px monospace";
    ctx.fillText("Press Start Game", canvas.width / 2, canvas.height / 2 + 20);
    ctx.restore();
    requestAnimationFrame(gameLoop);
    return;
  }

  // Update and draw
  game.ship.update();
  game.ship.draw();

  for (let ast of game.asteroids) {
    ast.update();
    ast.draw();
  }

  // Collisions: ship <-> asteroid
  for (let ast of game.asteroids) {
    if (!game.ship.dead && game.ship.invulnerable <= 0 && dist(game.ship, ast) < ast.r + game.ship.radius) {
      game.ship.dead = true;
      setTimeout(() => game.loseLife(), 1000);
    }
  }

  // Bullets <-> asteroid
  let newAsteroids = [];
  for (let ast of game.asteroids) {
    for (let b of game.ship.bullets) {
      if (dist(b, ast) < ast.r) {
        b.life = 0;
        game.ship.score += [20, 50, 100][ast.gen - 1] || 100;
        if (ast.r > 22) {
          for (let j = 0; j < 2; ++j) {
            let angle = randBetween(0, Math.PI * 2);
            let mag = randBetween(1, 2);
            newAsteroids.push(new Asteroid(ast.x, ast.y, ast.r / 1.7, Math.cos(angle) * mag, Math.sin(angle) * mag, ast.gen + 1));
          }
        }
        ast.r = 0;
      }
    }
    if (ast.r > 0) newAsteroids.push(ast);
  }
  game.asteroids = newAsteroids;

  // Extra life every 10k points
  if (game.ship.score >= (game.ship.lives - 3 + 1) * 10000) {
    game.ship.lives++;
  }

  // Level cleared?
  if (game.asteroids.length === 0 && game.state === "playing") {
    setTimeout(() => game.nextLevel(), 1100);
  }

  drawUI();
  requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (game.state !== "playing") return;
  if (e.code === "ArrowLeft") game.ship.angle -= 0.13;
  if (e.code === "ArrowRight") game.ship.angle += 0.13;
  if (e.code === "ArrowUp") game.ship.thrust = true;
  if (e.code === "Space") game.ship.shoot();
  if (e.code === "KeyH") game.ship.hyperspace();
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === "ArrowUp") game.ship.thrust = false;
});

document.getElementById('startBtn').onclick = startGame;

// Start the game loop
gameLoop();
