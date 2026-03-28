const TYPES = [
  { id: 'shield',    color: 0x00ffff, emissive: 0x006666, label: 'SHIELD +50',    wireColor: 0x00ffff },
  { id: 'turbo',     color: 0xffff00, emissive: 0x666600, label: 'TURBO BOOST!',  wireColor: 0xffff00 },
  { id: 'rapidfire', color: 0xff44ff, emissive: 0x660066, label: 'RAPID FIRE!',   wireColor: 0xff44ff },
];

const DURATIONS = { turbo: 6, rapidfire: 8, shield: 0 };
const POOL_SIZE  = 5;
const COLLECT_RADIUS = 6;

export class PowerUpSystem {
  constructor(scene, ship) {
    this.scene = scene;
    this.ship  = ship;
    this.pool  = [];
    this.active = {}; // type → remaining seconds
    this.spawnTimer    = 0;
    this.spawnInterval = 14;

    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this._build());
    }
  }

  _build() {
    const geo = new THREE.OctahedronGeometry(1.4, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff, emissive: 0xffffff,
      emissiveIntensity: 0.6, shininess: 80,
      transparent: true, opacity: 0.92
    });
    const mesh  = new THREE.Mesh(geo, mat);
    const wGeo  = new THREE.WireframeGeometry(geo);
    const wMat  = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.45
    });
    const wire  = new THREE.LineSegments(wGeo, wMat);
    mesh.add(wire);
    mesh.visible = false;
    this.scene.add(mesh);
    return { mesh, wire, wMat, alive: false, typeId: null, label: '', collected: false };
  }

  _spawn() {
    const slot = this.pool.find(p => !p.alive);
    if (!slot) return;

    const def = TYPES[Math.floor(Math.random() * TYPES.length)];
    slot.typeId = def.id;
    slot.label  = def.label;

    slot.mesh.material.color.setHex(def.color);
    slot.mesh.material.emissive.setHex(def.emissive);
    slot.wMat.color.setHex(def.wireColor);

    slot.mesh.position.set(
      (Math.random() - 0.5) * 26,
      (Math.random() - 0.5) * 14,
      this.ship.position.z - (70 + Math.random() * 60)
    );
    slot.mesh.visible = true;
    slot.alive        = true;
    slot.collected    = false;
  }

  update(delta) {
    // Spawn timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this._spawn();
      this.spawnTimer = 0;
    }

    // Tick active effect durations
    for (const id of Object.keys(this.active)) {
      this.active[id] -= delta;
      if (this.active[id] <= 0) delete this.active[id];
    }

    // Animate and check collection
    for (const p of this.pool) {
      if (!p.alive) continue;

      p.mesh.rotation.y += delta * 1.8;
      p.mesh.rotation.x += delta * 0.9;

      // Pulse emissive
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
      p.mesh.material.emissiveIntensity = 0.4 + pulse * 0.5;

      // Collect check
      if (p.mesh.position.distanceTo(this.ship.position) < COLLECT_RADIUS) {
        p.mesh.visible = false;
        p.alive        = false;
        p.collected    = true;
        if (DURATIONS[p.typeId] > 0) {
          this.active[p.typeId] = DURATIONS[p.typeId];
        }
        continue;
      }

      // Despawn if passed the ship
      if (p.mesh.position.z > this.ship.position.z + 80) {
        p.mesh.visible = false;
        p.alive        = false;
      }
    }
  }

  /** Returns array of {typeId, label} for newly collected power-ups this frame. */
  drainCollected() {
    const out = [];
    for (const p of this.pool) {
      if (p.collected) {
        out.push({ typeId: p.typeId, label: p.label });
        p.collected = false;
      }
    }
    return out;
  }

  isActive(id)       { return !!(this.active[id] && this.active[id] > 0); }
  getRemaining(id)   { return this.active[id] || 0; }
}
