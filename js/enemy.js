// ─────────────────────────────────────────────────────────────
//  BASE
// ─────────────────────────────────────────────────────────────
class BaseEnemy {
  constructor() {
    this.group  = new THREE.Group();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    this.alive  = false;
    this.hp     = 1;
    this.maxHp  = 1;
    this.speed  = 18;
    this.points = 100;
    this.type   = 'basic';
    this.group.visible = false;
  }

  spawn(shipPosition) {
    const angle  = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 30;
    this.group.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 36,
      shipPosition.z - (160 + Math.random() * 100)
    );
    this.boundingSphere.center.copy(this.group.position);
    this.group.visible = true;
    this.alive = true;
    this.hp    = this.maxHp;
    this.speed = this._baseSpeed();
    this._onSpawn && this._onSpawn();
  }

  _baseSpeed() { return 18 + Math.random() * 8; }

  update(delta, shipPosition) {
    if (!this.alive) return false; // no slow effect
    this._move(delta, shipPosition);
    this.boundingSphere.center.copy(this.group.position);
    if (this.group.position.z > shipPosition.z + 120) {
      this.deactivate();
    }
    return false;
  }

  _move(delta, shipPosition) {
    const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
    this.group.position.addScaledVector(dir, this.speed * delta * 0.6);
    this.group.position.z += this.speed * delta * 0.4;
  }

  hit() {
    this.hp--;
    if (this.hp <= 0) { this.deactivate(); return true; }
    return false;
  }

  deactivate() {
    this.alive         = false;
    this.group.visible = false;
  }

  checkCollisionWithShip(shipSphere) {
    return this.alive && this.boundingSphere.intersectsSphere(shipSphere);
  }

  getMesh()    { return this.group; }
  getPoints()  { return this.points; }
  getType()    { return this.type; }
}

// ─────────────────────────────────────────────────────────────
//  1. BASIC RED SHIP  (gap 12)
// ─────────────────────────────────────────────────────────────
export class EnemyShip extends BaseEnemy {
  constructor() {
    super();
    this.type   = 'basic';
    this.maxHp  = 1;
    this.points = 100;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 5),
      new THREE.MeshPhongMaterial({ color: 0xff3333, emissive: 0x550000, shininess: 30 })
    );
    this.group.add(body);

    const wingGeo = new THREE.BoxGeometry(4, 0.5, 2);
    const wingMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
    [-3.5, 3.5].forEach((x, i) => {
      const w = new THREE.Mesh(wingGeo, wingMat);
      w.position.set(x, 0, 0);
      w.rotation.y = (i === 0 ? 1 : -1) * Math.PI / 6;
      this.group.add(w);
    });

    const symbol = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 3, 5),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    symbol.position.set(0, 1.5, -1);
    symbol.rotation.x = Math.PI;
    this.group.add(symbol);
  }
}

// ─────────────────────────────────────────────────────────────
//  2. COSMIC COMMUNIST  (gap 19) – zigzags, 250 pts
// ─────────────────────────────────────────────────────────────
export class CosmicCommunist extends BaseEnemy {
  constructor() {
    super();
    this.type       = 'cosmic_communist';
    this.maxHp      = 2;
    this.points     = 250;
    this._zigTimer  = 0;
    this._zigDir    = 1;

    // Hammer-and-sickle-ish silhouette: red box + rotated cross pieces
    const mat = new THREE.MeshPhongMaterial({ color: 0xdd0000, emissive: 0x440000, shininess: 20 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), mat);
    this.group.add(body);

    // Distinctive star spike on top
    const star = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 5),
      new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x660000 })
    );
    star.position.set(0, 2.5, 0);
    this.group.add(star);

    // Side panels in yellow (Soviet colours)
    const panelMat = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
    [-3, 3].forEach(x => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 4), panelMat);
      p.position.set(x, 0, 0);
      this.group.add(p);
    });

    this.boundingSphere.radius = 5;
  }

  _onSpawn() { this._zigTimer = 0; this._zigDir = Math.random() > 0.5 ? 1 : -1; }

  _move(delta, shipPosition) {
    this._zigTimer += delta;
    if (this._zigTimer > 0.6) { this._zigTimer = 0; this._zigDir *= -1; }

    const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
    this.group.position.addScaledVector(dir, this.speed * delta * 0.5);
    this.group.position.z += this.speed * delta * 0.35;
    // Sideways zigzag
    this.group.position.x += this._zigDir * this.speed * delta * 0.8;
    this.group.rotation.z  = this._zigDir * 0.3;
  }
}

// ─────────────────────────────────────────────────────────────
//  3. WOKE DRONE  (gap 22) – tight pursuer, slow-field on hit
// ─────────────────────────────────────────────────────────────
export class WokeDrone extends BaseEnemy {
  constructor() {
    super();
    this.type   = 'woke_drone';
    this.maxHp  = 1;
    this.points = 500;
    this.slowTriggered = false;

    // Sleek purple disc shape
    const mat = new THREE.MeshPhongMaterial({ color: 0x9933ff, emissive: 0x330066, shininess: 60 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.6, 12), mat);
    disc.rotation.x = Math.PI / 2;
    this.group.add(disc);

    // Glowing ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.8, 0.2, 8, 24),
      new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0x990099, shininess: 80 })
    );
    ring.rotation.x = Math.PI / 2;
    this.group.add(ring);

    // Central core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xaa00aa })
    );
    this.group.add(core);

    this.boundingSphere.radius = 4.5;
  }

  _baseSpeed() { return 22 + Math.random() * 6; }

  _move(delta, shipPosition) {
    // Pure homing – closes in quickly
    const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
    this.group.position.addScaledVector(dir, this.speed * delta * 0.85);
    this.group.position.z += this.speed * delta * 0.15;
    this.group.rotation.z += delta * 3;
  }

  /** Returns true if the slow-field should be applied (once per life). */
  triggerSlow() {
    if (this.slowTriggered) return false;
    this.slowTriggered = true;
    return true;
  }

  _onSpawn() { this.slowTriggered = false; }
}

// ─────────────────────────────────────────────────────────────
//  4. MINI-BOSS  (gap 24) – 5 HP, large, appears once at ~1000 km
// ─────────────────────────────────────────────────────────────
export class MiniBoss extends BaseEnemy {
  constructor() {
    super();
    this.type   = 'miniboss';
    this.maxHp  = 5;
    this.points = 2000;

    const mat  = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0x441100, shininess: 40 });
    const mat2 = new THREE.MeshPhongMaterial({ color: 0xcc3300, emissive: 0x330000, shininess: 20 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 16), mat);
    this.group.add(body);

    // Bridge tower
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 5), mat2);
    bridge.position.set(0, 5, -2);
    this.group.add(bridge);

    // Wide wings
    [-9, 9].forEach(x => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 10), mat2);
      w.position.set(x, -1, 0);
      this.group.add(w);
    });

    // Engine pods
    [-4, 4].forEach(x => {
      const e = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 6, 8), mat);
      e.rotation.x = Math.PI / 2;
      e.position.set(x, -2, 6);
      this.group.add(e);
    });

    this.boundingSphere.radius = 12;
    this._flashTimer = 0;
    this._hitFlash   = 0;
    this._origColor  = 0xff6600;
  }

  spawn(shipPosition) {
    this.group.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 6,
      shipPosition.z - 280
    );
    this.boundingSphere.center.copy(this.group.position);
    this.group.visible = true;
    this.alive = true;
    this.hp    = this.maxHp;
    this._hitFlash = 0;
  }

  _baseSpeed() { return 8 + Math.random() * 4; }

  _move(delta, shipPosition) {
    const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
    this.group.position.addScaledVector(dir, this.speed * delta * 0.4);
    this.group.position.z += this.speed * delta * 0.3;
    this.group.rotation.y += delta * 0.4;
  }

  update(delta, shipPosition) {
    if (!this.alive) return false;
    this._move(delta, shipPosition);
    this.boundingSphere.center.copy(this.group.position);

    // Hit flash
    if (this._hitFlash > 0) {
      this._hitFlash -= delta;
      this.group.children.forEach(c => {
        if (c.material) c.material.emissiveIntensity = 3 * (this._hitFlash / 0.25);
      });
    } else {
      this.group.children.forEach(c => {
        if (c.material) c.material.emissiveIntensity = 1;
      });
    }

    if (this.group.position.z > shipPosition.z + 150) this.deactivate();
    return false;
  }

  hit() {
    this.hp--;
    this._hitFlash = 0.25;
    if (this.hp <= 0) { this.deactivate(); return true; }
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
//  5. FINAL BOSS – bureaucratic Martian station (gap 28)
//     10 HP, fires red projectiles, 5000 pts
// ─────────────────────────────────────────────────────────────
export class FinalBoss extends BaseEnemy {
  constructor(scene) {
    super();
    this.type    = 'finalboss';
    this.maxHp   = 10;
    this.points  = 5000;
    this._scene  = scene;
    this._shotPool  = [];
    this._shotTimer = 0;
    this._shotInterval = 2.5;
    this._phase  = 1;
    this._rotSpd = 0.15;

    this._lights = [];
    this._buildStation();
    this._buildShotPool();
    this.boundingSphere.radius = 28;
  }

  _buildStation() {
    const mat  = new THREE.MeshPhongMaterial({ color: 0x884400, emissive: 0x220800, shininess: 20 });
    const mat2 = new THREE.MeshPhongMaterial({ color: 0x555555, emissive: 0x111111, shininess: 40 });
    const matR = new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0x660000, shininess: 60 });

    // Central hub
    const hub = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 14), mat);
    this.group.add(hub);

    // Rotating torus ring
    this._ring = new THREE.Mesh(new THREE.TorusGeometry(22, 2, 8, 32), mat2);
    this.group.add(this._ring);

    // Arm spokes
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 20), mat2);
      arm.rotation.z = (i / 4) * Math.PI * 2;
      arm.position.x = Math.cos((i / 4) * Math.PI * 2) * 14;
      arm.position.y = Math.sin((i / 4) * Math.PI * 2) * 14;
      this.group.add(arm);
    }

    // Red cannon ports
    for (let i = 0; i < 4; i++) {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1, 5, 8), matR);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(
        Math.cos((i / 4) * Math.PI * 2) * 10,
        Math.sin((i / 4) * Math.PI * 2) * 10,
        -8
      );
      this.group.add(cannon);
    }

    // Warning lights
    for (let i = 0; i < 6; i++) {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 6, 6),
        new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 })
      );
      light.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        -7
      );
      this.group.add(light);
      this._lights.push(light);
    }
  }

  _buildShotPool() {
    const geo = new THREE.SphereGeometry(0.8, 6, 6);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending
    });
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this._scene.add(mesh);
      this._shotPool.push({ mesh, alive: false, vel: new THREE.Vector3() });
    }
  }

  spawn(shipPosition) {
    this.group.position.set(0, 0, shipPosition.z - 400);
    this.boundingSphere.center.copy(this.group.position);
    this.group.visible = true;
    this.alive = true;
    this.hp    = this.maxHp;
    this._phase = 1;
    this._shotTimer = 0;
    this._shotInterval = 2.5;
  }

  update(delta, shipPosition) {
    if (!this.alive) return false;

    // Drift toward player slowly
    const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
    this.group.position.addScaledVector(dir, 5 * delta);
    this.group.rotation.y += delta * this._rotSpd;
    this._ring.rotation.x += delta * 0.6;

    this.boundingSphere.center.copy(this.group.position);

    // Phase 2 when half-health
    if (this.hp <= Math.ceil(this.maxHp / 2) && this._phase === 1) {
      this._phase = 2;
      this._shotInterval = 1.4;
      this._rotSpd = 0.35;
      // Flash all lights
      if (this._lights) this._lights.forEach(l => l.material.emissiveIntensity = 4);
    }

    // Flash lights
    if (this._lights) {
      const flash = 1.5 + 1.5 * Math.sin(Date.now() * 0.006 * this._phase);
      this._lights.forEach(l => { l.material.emissiveIntensity = flash; });
    }

    // Fire shots
    this._shotTimer += delta;
    if (this._shotTimer >= this._shotInterval) {
      this._shotTimer = 0;
      this._fireAtPlayer(shipPosition);
    }

    // Update shots
    for (const shot of this._shotPool) {
      if (!shot.alive) continue;
      shot.mesh.position.addScaledVector(shot.vel, delta);
      if (shot.mesh.position.distanceTo(this.group.position) > 500) {
        shot.mesh.visible = false;
        shot.alive = false;
      }
    }

    return false;
  }

  _fireAtPlayer(shipPosition) {
    const shots  = this._phase === 2 ? 3 : 1;
    const spread = 0.15;
    for (let s = 0; s < shots; s++) {
      const slot = this._shotPool.find(p => !p.alive);
      if (!slot) break;
      slot.mesh.position.copy(this.group.position);
      const dir = new THREE.Vector3().subVectors(shipPosition, this.group.position).normalize();
      dir.x += (Math.random() - 0.5) * spread * s;
      dir.y += (Math.random() - 0.5) * spread * s;
      dir.normalize();
      slot.vel.copy(dir).multiplyScalar(35);
      slot.mesh.visible = true;
      slot.alive = true;
    }
  }

  /** Check if any boss projectile hits the player ship sphere. */
  checkShotsVsShip(shipSphere) {
    for (const shot of this._shotPool) {
      if (!shot.alive) continue;
      const shotSphere = new THREE.Sphere(shot.mesh.position, 1.5);
      if (shotSphere.intersectsSphere(shipSphere)) {
        shot.mesh.visible = false;
        shot.alive = false;
        return true;
      }
    }
    return false;
  }

  hit() {
    this.hp--;
    if (this.hp <= 0) {
      this.deactivate();
      // Hide shots
      for (const s of this._shotPool) { s.mesh.visible = false; s.alive = false; }
      return true;
    }
    return false;
  }

  deactivate() {
    super.deactivate();
    for (const s of this._shotPool) { s.mesh.visible = false; s.alive = false; }
  }
}

// ─────────────────────────────────────────────────────────────
//  ENEMY MANAGER
// ─────────────────────────────────────────────────────────────
const POOL_SIZE = 10;

export class EnemyManager {
  constructor(ship, scene) {
    this.ship  = ship;
    this.scene = scene;

    // Regular enemy pool (basic + cosmic + woke)
    this.pool  = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this._makeRegular(0));
    }
    this.pool.forEach(e => scene.add(e.getMesh()));

    // Mini-boss (single instance)
    this.miniBoss        = new MiniBoss();
    this.miniBossSpawned = false;
    scene.add(this.miniBoss.getMesh());

    // Final boss
    this.finalBoss        = new FinalBoss(scene);
    this.finalBossSpawned = false;
    scene.add(this.finalBoss.getMesh());

    this.spawnTimer    = 0;
    this.baseInterval  = 5;
    this.spawnInterval = this.baseInterval;
    this.maxActive     = 4;
    this.distThreshold = 200;

    // Woke slow state (communicated back to main.js)
    this.slowTimer = 0;
  }

  _makeRegular(km) {
    const roll = Math.random();
    if (km < 500 || roll < 0.50) return new EnemyShip();
    if (roll < 0.80)             return new CosmicCommunist();
    return new WokeDrone();
  }

  _spawnRegular(km) {
    const inactive = this.pool.find(e => !e.alive);
    if (!inactive) return;

    const roll = Math.random();
    let next;
    if (km < 500 || roll < 0.50)    next = new EnemyShip();
    else if (roll < 0.80)           next = new CosmicCommunist();
    else                            next = new WokeDrone();

    // Re-use the mesh slot: swap the mesh in scene
    this.scene.remove(inactive.getMesh());
    const idx = this.pool.indexOf(inactive);
    this.pool[idx] = next;
    this.scene.add(next.getMesh());

    next.spawn(this.ship.position);
  }

  update(delta, km) {
    this.spawnTimer += delta;

    const progressLevel  = Math.floor(km / this.distThreshold);
    this.spawnInterval   = Math.max(1.8, this.baseInterval - progressLevel * 0.4);
    this.maxActive       = Math.min(8, 4 + Math.floor(progressLevel * 0.6));

    const activeCount = this.pool.filter(e => e.alive).length;

    if (this.spawnTimer >= this.spawnInterval && activeCount < this.maxActive) {
      this._spawnRegular(km);
      this.spawnTimer = 0;
    }

    // Mini-boss at 800 km
    if (!this.miniBossSpawned && km >= 800) {
      this.miniBoss.spawn(this.ship.position);
      this.miniBossSpawned = true;
    }

    // Final boss at 4000 km
    if (!this.finalBossSpawned && km >= 4000) {
      this.finalBoss.spawn(this.ship.position);
      this.finalBossSpawned = true;
    }

    for (const e of this.pool) {
      const slowApplied = e.update(delta, this.ship.position);
    }

    this.miniBoss.update(delta, this.ship.position);
    this.finalBoss.update(delta, this.ship.position);

    // Tick slow debuff
    if (this.slowTimer > 0) this.slowTimer -= delta;
  }

  applySlowDebuff(seconds) {
    this.slowTimer = Math.max(this.slowTimer, seconds);
  }

  isSlowed() { return this.slowTimer > 0; }

  getPool()      { return this.pool; }
  getMiniBoss()  { return this.miniBoss; }
  getFinalBoss() { return this.finalBoss; }

  /** Legacy compat. */
  getEnemies()   { return this.pool; }
  getActiveCount() { return this.pool.filter(e => e.alive).length; }
}
