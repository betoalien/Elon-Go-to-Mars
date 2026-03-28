export class ExplosionSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = []; // { points, velBuf, originBuf, life, maxLife }
  }

  /**
   * Spawn an explosion at worldPosition.
   * @param {THREE.Vector3} position
   * @param {number} color  hex colour
   * @param {number} scale  size multiplier (1 = normal, 3 = boss)
   */
  spawn(position, color = 0xff6600, scale = 1) {
    const count = Math.floor(70 * Math.min(scale, 4));
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const vel   = new Float32Array(count * 3);
    const orig  = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = position.x;
      pos[i * 3 + 1] = position.y;
      pos[i * 3 + 2] = position.z;
      orig[i * 3]    = position.x;
      orig[i * 3 + 1]= position.y;
      orig[i * 3 + 2]= position.z;

      const speed = (4 + Math.random() * 10) * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      vel[i * 3]     = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size: 1.5 * scale,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const maxLife = 0.7 + scale * 0.15;
    this.active.push({ points, vel, orig, life: maxLife, maxLife });

    // Secondary smaller ring
    if (scale > 1) {
      this._spawnRing(position, color, scale);
    }
  }

  _spawnRing(position, color, scale) {
    const count = 30;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const vel   = new Float32Array(count * 3);
    const orig  = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = position.x;
      pos[i * 3 + 1] = position.y;
      pos[i * 3 + 2] = position.z;
      orig[i * 3]    = position.x;
      orig[i * 3 + 1]= position.y;
      orig[i * 3 + 2]= position.z;
      const angle = (i / count) * Math.PI * 2;
      const speed = (6 + Math.random() * 4) * scale;
      vel[i * 3]     = Math.cos(angle) * speed;
      vel[i * 3 + 1] = (Math.random() - 0.5) * speed * 0.3;
      vel[i * 3 + 2] = Math.sin(angle) * speed;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2 * scale,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    const maxLife = 0.5;
    this.active.push({ points, vel, orig, life: maxLife, maxLife });
  }

  update(delta) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const exp = this.active[i];
      exp.life -= delta;

      if (exp.life <= 0) {
        this.scene.remove(exp.points);
        exp.points.geometry.dispose();
        exp.points.material.dispose();
        this.active.splice(i, 1);
        continue;
      }

      const t   = 1 - exp.life / exp.maxLife;
      const attr = exp.points.geometry.attributes.position;
      for (let j = 0; j < attr.count; j++) {
        attr.setX(j, exp.orig[j * 3]     + exp.vel[j * 3]     * t);
        attr.setY(j, exp.orig[j * 3 + 1] + exp.vel[j * 3 + 1] * t);
        attr.setZ(j, exp.orig[j * 3 + 2] + exp.vel[j * 3 + 2] * t);
      }
      attr.needsUpdate = true;
      exp.points.material.opacity = Math.pow(exp.life / exp.maxLife, 0.6);
    }
  }
}
