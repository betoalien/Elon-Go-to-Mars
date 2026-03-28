import { createStars }         from './stars.js';
import { createShip }          from './ship.js';
import { GameCamera }          from './camera.js';
import { InputManager }        from './input.js';
import { PropulsionParticles } from './propulsion.js';
import { LaserSystem }         from './lasers.js';
import { EnemyManager }        from './enemy.js';
import { AudioSystem }         from './audio.js';
import { ExplosionSystem }     from './explosion.js';
import { ScoreSystem }         from './score.js';
import { PowerUpSystem }       from './powerup.js';

// ─────────────────────────────────────────────────────────────
//  RENDERER + SCENE
// ─────────────────────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.fog      = new THREE.FogExp2(0x000022, 0.00025);

const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000011);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x404040, 1.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 15, 20);
scene.add(dirLight);

// ─────────────────────────────────────────────────────────────
//  GAME OBJECTS
// ─────────────────────────────────────────────────────────────
const { stars, update: updateStars } = createStars();
scene.add(stars);

const ship = createShip();
scene.add(ship);

const propulsion = new PropulsionParticles(ship);
scene.add(propulsion.mesh);

const lasers = new LaserSystem(ship);
lasers.getMeshes().forEach(m => scene.add(m));

const enemyManager = new EnemyManager(ship, scene);

const gameCamera   = new GameCamera(camera, ship);
const input        = new InputManager();
const audio        = new AudioSystem();
const explosions   = new ExplosionSystem(scene);
const scoreSystem  = new ScoreSystem();
const powerups     = new PowerUpSystem(scene, ship);

// ─────────────────────────────────────────────────────────────
//  CHAPTERS  (gap 18)
// ─────────────────────────────────────────────────────────────
const CHAPTERS = [
  { name: 'DEEP SPACE',    minKm: 0,    maxKm: 800,  speed: 15, fogColor: 0x000022, fogDensity: 0.00025, bgColor: 0x000011 },
  { name: 'ASTEROID BELT', minKm: 800,  maxKm: 2000, speed: 22, fogColor: 0x001100, fogDensity: 0.00030, bgColor: 0x000a05 },
  { name: 'MARS APPROACH', minKm: 2000, maxKm: 4000, speed: 28, fogColor: 0x110800, fogDensity: 0.00035, bgColor: 0x080300 },
  { name: 'BOSS GAUNTLET', minKm: 4000, maxKm: 5000, speed: 32, fogColor: 0x150400, fogDensity: 0.00040, bgColor: 0x0c0100 },
];
let currentChapterIdx  = 0;
let chapterBannerTimer = 0;
let pendingChapterName = '';

function getChapter(km) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (km >= CHAPTERS[i].minKm) return { idx: i, ...CHAPTERS[i] };
  }
  return { idx: 0, ...CHAPTERS[0] };
}

// ─────────────────────────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────────────────────────
const STATE = { MENU: 'menu', PLAYING: 'playing', GAMEOVER: 'gameover', VICTORY: 'victory' };
let gameState = STATE.MENU;

let distanceTraveled = 0;
let forwardSpeed     = CHAPTERS[0].speed;
let shield           = 100;
const maxShield      = 100;
let damageCooldown   = 0;
let damageFlashTimer = 0;
let slowTimer        = 0; // woke-drone slow effect
let lastTime         = 0;
let victoryTriggered = false;

const shipBounding = new THREE.Sphere(new THREE.Vector3(), 4);

// ─────────────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────────────
const ui = {
  menu:            document.getElementById('menu'),
  playBtn:         document.getElementById('btn-play'),
  hud:             document.getElementById('hud'),
  distance:        document.getElementById('distance'),
  shieldPct:       document.getElementById('shield-percent'),
  shieldBar:       document.getElementById('shield-bar'),
  scoreEl:         document.getElementById('score'),
  multEl:          document.getElementById('multiplier'),
  multBar:         document.getElementById('mult-bar'),
  chapterBanner:   document.getElementById('chapter-banner'),
  chapterName:     document.getElementById('chapter-name'),
  powerupBar:      document.getElementById('powerup-bar'),
  elonFace:        document.getElementById('elon-face'),
  elonImage:       document.getElementById('elon-image'),
  gameOver:        document.getElementById('game-over'),
  finalDistance:   document.getElementById('final-distance'),
  finalScore:      document.getElementById('final-score'),
  highScore:       document.getElementById('high-score'),
  victory:         document.getElementById('victory-screen'),
  victoryScore:    document.getElementById('victory-score'),
  bossHP:          document.getElementById('boss-hp-bar'),
  bossHPContainer: document.getElementById('boss-hp-container'),
  marsProgress:    document.getElementById('mars-progress'),
};

// ─────────────────────────────────────────────────────────────
//  HIGH SCORE
// ─────────────────────────────────────────────────────────────
let highScore = parseInt(localStorage.getItem('etgm_highscore') || '0', 10);
function saveHighScore(s) {
  if (s > highScore) { highScore = s; localStorage.setItem('etgm_highscore', s); }
}

// ─────────────────────────────────────────────────────────────
//  MENU
// ─────────────────────────────────────────────────────────────
function showMenu() {
  gameState = STATE.MENU;
  ui.menu.classList.remove('hidden');
  ui.hud.classList.add('hidden');
  ui.gameOver.classList.add('hidden');
  if (ui.victory) ui.victory.classList.add('hidden');
  const hs = document.getElementById('menu-highscore');
  if (hs) hs.textContent = `Best: ${highScore.toLocaleString()} pts`;
}

function startGame() {
  audio.init();

  // Reset state
  distanceTraveled = 0;
  forwardSpeed     = CHAPTERS[0].speed;
  shield           = maxShield;
  damageCooldown   = 0;
  damageFlashTimer = 0;
  slowTimer        = 0;
  currentChapterIdx = 0;
  victoryTriggered  = false;
  lastTime          = 0;

  // Reset scene atmosphere
  renderer.setClearColor(CHAPTERS[0].bgColor);
  scene.fog = new THREE.FogExp2(CHAPTERS[0].fogColor, CHAPTERS[0].fogDensity);

  // Reset ship
  ship.position.set(0, 0, 0);
  ship.rotation.set(0, 0, 0);

  ui.menu.classList.add('hidden');
  ui.gameOver.classList.add('hidden');
  if (ui.victory) ui.victory.classList.add('hidden');
  ui.hud.classList.remove('hidden');

  if (ui.bossHPContainer) ui.bossHPContainer.classList.add('hidden');

  gameState = STATE.PLAYING;
  requestAnimationFrame(animate);
}

// ─────────────────────────────────────────────────────────────
//  GAME OVER / VICTORY
// ─────────────────────────────────────────────────────────────
function triggerGameOver() {
  gameState = STATE.GAMEOVER;
  audio.stopEngine();
  const s = scoreSystem.getScore();
  saveHighScore(s);
  if (ui.finalDistance) ui.finalDistance.textContent = `Distance: ${Math.floor(distanceTraveled)} km`;
  if (ui.finalScore)    ui.finalScore.textContent    = `Score: ${s.toLocaleString()}`;
  if (ui.highScore)     ui.highScore.textContent     = `Best: ${highScore.toLocaleString()}`;
  ui.gameOver.classList.remove('hidden');
}

function triggerVictory() {
  if (victoryTriggered) return;
  victoryTriggered = true;
  gameState = STATE.VICTORY;
  audio.stopEngine();
  audio.playVictory();
  const s = scoreSystem.getScore();
  saveHighScore(s);
  if (ui.victoryScore) ui.victoryScore.textContent = `Final Score: ${s.toLocaleString()}`;
  if (ui.victory) ui.victory.classList.remove('hidden');
  explosions.spawn(new THREE.Vector3(0, 0, ship.position.z - 20), 0xff8800, 4);
}

// ─────────────────────────────────────────────────────────────
//  CHAPTER TRANSITION  (gap 18)
// ─────────────────────────────────────────────────────────────
function checkChapter(km) {
  const ch = getChapter(km);
  if (ch.idx !== currentChapterIdx) {
    currentChapterIdx  = ch.idx;
    forwardSpeed       = ch.speed;
    renderer.setClearColor(ch.bgColor);
    scene.fog           = new THREE.FogExp2(ch.fogColor, ch.fogDensity);
    pendingChapterName  = ch.name;
    chapterBannerTimer  = 3.5;
    audio.playChapterFanfare();
    if (ch.name === 'BOSS GAUNTLET') {
      audio.playBossAlert();
    }
  }
}

function updateChapterBanner(delta) {
  if (chapterBannerTimer > 0) {
    chapterBannerTimer -= delta;
    if (ui.chapterBanner && ui.chapterName) {
      ui.chapterName.textContent = pendingChapterName;
      ui.chapterBanner.classList.remove('opacity-0');
      ui.chapterBanner.classList.add('opacity-100');
    }
  } else {
    if (ui.chapterBanner) {
      ui.chapterBanner.classList.remove('opacity-100');
      ui.chapterBanner.classList.add('opacity-0');
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  HUD UPDATE
// ─────────────────────────────────────────────────────────────
function updateHUD() {
  if (ui.distance)   ui.distance.textContent  = `Distance: ${Math.floor(distanceTraveled)} km`;
  if (ui.shieldPct)  ui.shieldPct.textContent = Math.floor(shield);
  if (ui.shieldBar) {
    ui.shieldBar.style.width = `${(shield / maxShield) * 100}%`;
    const low = shield < 30;
    ui.shieldBar.className = `h-full transition-all duration-300 ${
      low ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-cyan-400 to-blue-600'
    }`;
  }

  const sc  = scoreSystem.getScore();
  const mul = scoreSystem.getMultiplier();
  if (ui.scoreEl)  ui.scoreEl.textContent = sc.toLocaleString();
  if (ui.multEl)   ui.multEl.textContent  = `x${mul}`;
  if (ui.multBar) {
    const t = scoreSystem.getMultTimer() / 6;
    ui.multBar.style.width = `${Math.max(0, t * 100)}%`;
  }

  // Mars progress bar
  if (ui.marsProgress) {
    ui.marsProgress.style.width = `${Math.min(100, (distanceTraveled / 5000) * 100).toFixed(1)}%`;
  }

  // Power-up indicators
  if (ui.powerupBar) {
    const turbo  = powerups.getRemaining('turbo').toFixed(1);
    const rapid  = powerups.getRemaining('rapidfire').toFixed(1);
    let html = '';
    if (powerups.isActive('turbo'))     html += `<span class="px-2 py-0.5 bg-yellow-500/80 rounded text-black font-bold text-xs">TURBO ${turbo}s</span>`;
    if (powerups.isActive('rapidfire')) html += `<span class="px-2 py-0.5 bg-purple-500/80 rounded text-white font-bold text-xs">RAPID ${rapid}s</span>`;
    if (slowTimer > 0)                  html += `<span class="px-2 py-0.5 bg-blue-700/80 rounded text-white font-bold text-xs">SLOWED ${slowTimer.toFixed(1)}s</span>`;
    ui.powerupBar.innerHTML = html;
  }

  // Boss HP bar
  const miniBoss  = enemyManager.getMiniBoss();
  const finalBoss = enemyManager.getFinalBoss();
  if (ui.bossHPContainer) {
    let boss = null;
    if (finalBoss.alive) boss = finalBoss;
    else if (miniBoss.alive) boss = miniBoss;

    if (boss) {
      ui.bossHPContainer.classList.remove('hidden');
      if (ui.bossHP) ui.bossHP.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
    } else {
      ui.bossHPContainer.classList.add('hidden');
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  ANIMATION LOOP
// ─────────────────────────────────────────────────────────────
function animate(time = 0) {
  if (gameState !== STATE.PLAYING) {
    renderer.render(scene, camera);
    return;
  }

  requestAnimationFrame(animate);
  const delta = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // ── Input ──────────────────────────────────────────────
  const move = input.getMovement();
  const look = input.getLook();

  const effectiveSpeed = slowTimer > 0
    ? forwardSpeed * 0.45
    : (powerups.isActive('turbo') ? forwardSpeed * 1.6 : forwardSpeed);

  ship.position.x += move.dx * 0.25;
  ship.position.y += move.dy * 0.25;
  ship.position.x  = THREE.MathUtils.clamp(ship.position.x, -18, 18);
  ship.position.y  = THREE.MathUtils.clamp(ship.position.y, -12, 12);
  ship.rotation.y  = look.yaw;
  ship.rotation.x  = look.pitch;
  ship.rotation.z  = look.yaw * -0.8;
  ship.position.z -= effectiveSpeed * delta;

  // ── Slow timer ─────────────────────────────────────────
  if (slowTimer > 0) slowTimer -= delta;

  // ── Lasers ─────────────────────────────────────────────
  const fireCooldown = powerups.isActive('rapidfire') ? 0.07 : 0.15;
  lasers.cooldownTime = fireCooldown;
  if (input.keys[' '] || input.isActionPressed()) {
    lasers.fire();
    audio.playLaser();
  }

  // ── Updates ────────────────────────────────────────────
  distanceTraveled += effectiveSpeed * delta * 0.1;
  checkChapter(distanceTraveled);
  updateChapterBanner(delta);

  updateStars(delta, effectiveSpeed);
  propulsion.update(delta, effectiveSpeed);
  lasers.update(delta);
  enemyManager.update(delta, distanceTraveled);
  powerups.update(delta);
  explosions.update(delta);
  scoreSystem.update(delta, camera);
  audio.setEngineSpeed(effectiveSpeed);

  shipBounding.center.copy(ship.position);

  // ── Laser vs regular enemies ───────────────────────────
  for (const laser of lasers.getMeshes()) {
    if (!laser.visible) continue;
    laser.userData.boundingSphere.center.copy(laser.position);

    for (const enemy of enemyManager.getPool()) {
      if (!enemy.alive) continue;
      if (laser.userData.boundingSphere.intersectsSphere(enemy.boundingSphere)) {
        laser.visible = false;
        const killed = enemy.hit();
        if (killed) {
          explosions.spawn(enemy.group.position.clone(), 0xff4400, 1);
          audio.playExplosion(1);
          scoreSystem.addKill(enemy.getPoints(), enemy.group.position.clone(), camera, enemy.getType());
        }
        break;
      }
    }
  }

  // ── Laser vs mini-boss ─────────────────────────────────
  const mb = enemyManager.getMiniBoss();
  if (mb.alive) {
    for (const laser of lasers.getMeshes()) {
      if (!laser.visible) continue;
      laser.userData.boundingSphere.center.copy(laser.position);
      if (laser.userData.boundingSphere.intersectsSphere(mb.boundingSphere)) {
        laser.visible = false;
        const killed = mb.hit();
        if (killed) {
          explosions.spawn(mb.group.position.clone(), 0xff8800, 3);
          audio.playExplosion(3);
          scoreSystem.addKill(mb.getPoints(), mb.group.position.clone(), camera, 'miniboss');
        }
      }
    }
  }

  // ── Laser vs final boss ────────────────────────────────
  const fb = enemyManager.getFinalBoss();
  if (fb.alive) {
    for (const laser of lasers.getMeshes()) {
      if (!laser.visible) continue;
      laser.userData.boundingSphere.center.copy(laser.position);
      if (laser.userData.boundingSphere.intersectsSphere(fb.boundingSphere)) {
        laser.visible = false;
        const killed = fb.hit();
        if (killed) {
          explosions.spawn(fb.group.position.clone(), 0xff6600, 5);
          audio.playExplosion(4);
          scoreSystem.addKill(fb.getPoints(), fb.group.position.clone(), camera, 'finalboss');
          triggerVictory();
          return;
        }
      }
    }
    // Boss shots vs player
    if (fb.checkShotsVsShip(shipBounding) && damageCooldown <= 0) {
      _applyDamage(20);
      tookDamage = true;
    }
  }

  // ── Enemy/boss collision vs ship ───────────────────────
  damageCooldown -= delta;
  let tookDamage = false;

  for (const enemy of enemyManager.getPool()) {
    if (!enemy.alive) continue;
    if (enemy.checkCollisionWithShip(shipBounding) && damageCooldown <= 0) {
      _applyDamage(25);
      tookDamage = true;
      // Woke drone slow field
      if (enemy.getType() === 'woke_drone') {
        enemy.triggerSlow && enemy.triggerSlow();
        slowTimer = 4;
      }
      enemy.hit();
      break;
    }
  }

  if (mb.alive && mb.checkCollisionWithShip(shipBounding) && damageCooldown <= 0) {
    _applyDamage(35);
    tookDamage = true;
  }

  // ── Power-up collection ────────────────────────────────
  for (const { typeId, label } of powerups.drainCollected()) {
    audio.playPowerUp();
    scoreSystem.spawnText(label, ship.position.clone(), camera);
    if (typeId === 'shield') {
      shield = Math.min(maxShield, shield + 50);
    }
  }

  // ── Damage effects ─────────────────────────────────────
  if (damageFlashTimer > 0) {
    damageFlashTimer -= delta;
    renderer.domElement.style.boxShadow = `inset 0 0 80px rgba(220,0,0,${(damageFlashTimer * 2).toFixed(2)})`;
  } else {
    renderer.domElement.style.boxShadow = '';
  }

  // ── Elon face ──────────────────────────────────────────
  if (tookDamage && ui.elonFace) {
    ui.elonFace.style.opacity = '0.72';
    setTimeout(() => { if (ui.elonFace) ui.elonFace.style.opacity = '0'; }, 1200);
  }

  // ── Game over ──────────────────────────────────────────
  if (shield <= 0) { triggerGameOver(); return; }

  // ── Victory at 5000 km (no boss route) ────────────────
  if (distanceTraveled >= 5000 && !victoryTriggered) {
    triggerVictory();
    return;
  }

  // ── HUD ────────────────────────────────────────────────
  updateHUD();

  gameCamera.update();
  renderer.render(scene, camera);
}

function _applyDamage(amount) {
  shield -= amount;
  shield  = Math.max(0, shield);
  damageCooldown   = 1.5;
  damageFlashTimer = 0.4;
  audio.playDamage();
  scoreSystem.onDamage();
}

// ─────────────────────────────────────────────────────────────
//  INPUT WIRING
// ─────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();

  if (gameState === STATE.MENU && (key === 'enter' || key === ' ')) {
    startGame();
    return;
  }
  if ((gameState === STATE.GAMEOVER || gameState === STATE.VICTORY) && key === 'r') {
    location.reload();
  }
});

if (ui.playBtn) {
  ui.playBtn.addEventListener('click', startGame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────
showMenu();

// Render a single frame so the stars are visible behind the menu
renderer.render(scene, camera);
