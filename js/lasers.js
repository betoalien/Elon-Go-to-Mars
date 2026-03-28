export class LaserSystem {
  constructor(ship) {
    this.ship = ship;
    this.poolSize = 20;
    this.lasers = [];
    this.cooldown = 0;
    this.cooldownTime = 0.15; // segundos entre disparos

    // Pool de láseres
    this.laserGeometry = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
    this.laserMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < this.poolSize; i++) {
      const laser = new THREE.Mesh(this.laserGeometry, this.laserMaterial);
      laser.visible = false;
      laser.rotation.x = Math.PI / 2; // orientado hacia adelante
      this.lasers.push(laser);
    }
  }

fire() {
  if (this.cooldown > 0) return;

  const laser = this.lasers.find(l => !l.visible);
  if (!laser) return;

  // Posicionar en la nariz
  laser.position.copy(this.ship.position);
  laser.position.z -= 8;  // adelante de la nariz

  laser.quaternion.copy(this.ship.quaternion);

  laser.visible = true;
  laser.userData = { 
    speed: 60,
    alive: true,
    boundingSphere: new THREE.Sphere(laser.position.clone(), 1.5)  // radio del láser
  };

  this.cooldown = this.cooldownTime;
}

update(delta) {
  this.cooldown = Math.max(0, this.cooldown - delta);

  for (const laser of this.lasers) {
    if (!laser.visible) continue;  // saltamos los inactivos

    // Mover el láser hacia adelante en su dirección
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(laser.quaternion);
    laser.position.addScaledVector(direction, laser.userData.speed * delta);

    // Actualizar la bounding sphere (necesaria para colisiones)
    laser.userData.boundingSphere.center.copy(laser.position);

    // Desactivar si se aleja demasiado del barco
    if (laser.position.distanceTo(this.ship.position) > 600) {
      laser.visible = false;
    }
  }
}

  getMeshes() {
    return this.lasers;
  }
}