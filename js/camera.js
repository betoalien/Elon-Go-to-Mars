export class GameCamera {
  constructor(threeCamera, ship) {
    this.camera = threeCamera;
    this.ship = ship;
    this.offset = new THREE.Vector3(0, 6, 22); // relative to ship
    this.lerpFactor = 0.12; // suavizado (0.05 = muy lento, 0.2 = más rápido)
  }

  update() {
    // Offset rotated according to ship orientation
    const rotatedOffset = this.offset.clone().applyQuaternion(this.ship.quaternion);
    
    const idealPosition = this.ship.position.clone().add(rotatedOffset);
    
    // Smooth lerp towards ideal position
    this.camera.position.lerp(idealPosition, this.lerpFactor);
    
    // Always look at ship (smooth lookAt could be added later if needed)
    this.camera.lookAt(this.ship.position);
  }
}