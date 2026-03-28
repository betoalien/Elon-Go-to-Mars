export class PropulsionParticles {
  constructor(ship) {
    this.ship = ship;
    this.particleCount = 400;
    this.particles = [];
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.sizes     = new Float32Array(this.particleCount);
    this.opacities = new Float32Array(this.particleCount);
    this.colors    = new Float32Array(this.particleCount * 3);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('size',     new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('opacity',  new THREE.BufferAttribute(this.opacities, 1));
    this.geometry.setAttribute('color',    new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;

    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i] = { life: 0, maxLife: 0.01, velX: 0, velY: 0, relVelZ: 0 };
      this._resetParticle(i);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate     = true;
    this.geometry.attributes.opacity.needsUpdate  = true;
    this.geometry.attributes.color.needsUpdate    = true;
  }

  // Spawn at engine world-position with correct velocities.
  // forwardSpeed: how fast the ship moves in -z per second.
  // Particle world-z velocity = -forwardSpeed + relVelZ, where relVelZ > 0
  // means the particle drifts backward (toward +z) relative to ship.
  _resetParticle(index, forwardSpeed = 15) {
    const offset = index * 3;
    const life = Math.random() * 0.35 + 0.1;

    // Engine is at ship.position + local (0,0,+7)  (back of the Starship)
    this.positions[offset]     = this.ship.position.x + (Math.random() - 0.5) * 1.5;
    this.positions[offset + 1] = this.ship.position.y + (Math.random() - 0.5) * 1.2;
    this.positions[offset + 2] = this.ship.position.z + 7;

    this.sizes[index]    = Math.random() * 2.0 + 1.5;
    this.opacities[index] = 1.0;

    // Colour: yellow → orange → red
    const t = Math.random();
    let r, g, b;
    if (t < 0.3)      { r = 1.0; g = 0.9 + Math.random() * 0.1; b = 0.4; }
    else if (t < 0.7) { r = 1.0; g = 0.5 + Math.random() * 0.3; b = 0.1; }
    else              { r = 0.9; g = 0.2; b = 0.05; }
    this.colors[offset]     = r;
    this.colors[offset + 1] = g;
    this.colors[offset + 2] = b;

    const drift = 5 + Math.random() * 12; // units/sec the particle falls behind the ship
    this.particles[index] = {
      life,
      maxLife: life,
      velX: (Math.random() - 0.5) * 3,
      velY: (Math.random() - 0.5) * 3,
      // World z velocity = -forwardSpeed + drift  (since drift < forwardSpeed it's still negative,
      // but the ship outruns the particle → exhaust trail appears behind)
      worldVelZ: -forwardSpeed + drift
    };
  }

  update(delta, forwardSpeed = 15) {
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this._resetParticle(i, forwardSpeed);
        continue;
      }

      const idx     = i * 3;
      const progress = 1 - p.life / p.maxLife;

      this.positions[idx]     += p.velX * delta;
      this.positions[idx + 1] += p.velY * delta;
      this.positions[idx + 2] += p.worldVelZ * delta;

      this.opacities[i] = 1.0 - progress * 0.9;
      this.sizes[i]     = (1.0 - progress * 0.65) * (Math.random() * 1.5 + 1);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate     = true;
    this.geometry.attributes.opacity.needsUpdate  = true;
  }

  get mesh() { return this.points; }
}
