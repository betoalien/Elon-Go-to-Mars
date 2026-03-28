export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseX = 0;       // normalized -1 to 1
    this.mouseY = 0;
    this.touchActive = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Bind events
    window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup',   e => this.keys[e.key.toLowerCase()] = false);

    document.addEventListener('mousemove', e => {
      if (!this.isTouchDevice) {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      }
    });

    // Touch events (para móvil)
    document.addEventListener('touchstart', e => {
      if (this.isTouchDevice) {
        this.touchActive = true;
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
      }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (this.touchActive) {
        const touch = e.touches[0];
        this.touchMoveX = (touch.clientX - this.touchStartX) / window.innerWidth * 4; // sensibilidad
        this.touchMoveY = (touch.clientY - this.touchStartY) / window.innerHeight * 4;
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.touchActive = false;
      this.touchMoveX = 0;
      this.touchMoveY = 0;
    });
  }

  getMovement() {
    let dx = 0, dy = 0;

    // Teclado (WASD o flechas)
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    if (this.keys['w'] || this.keys['arrowup']) dy += 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy -= 1;

    // Touch (joystick virtual simple: mover dedo izquierda/derecha/arriba/abajo)
    if (this.isTouchDevice && this.touchActive) {
      dx += this.touchMoveX;
      dy -= this.touchMoveY; // invertido para que subir dedo = subir nave
    }

    return { dx: THREE.MathUtils.clamp(dx, -1, 1), dy: THREE.MathUtils.clamp(dy, -1, 1) };
  }

  getLook() {
    let yaw = 0, pitch = 0;

    if (this.isTouchDevice) {
      // Touch look: mover dedo horizontal/vertical
      yaw   = this.touchMoveX * -0.4;
      pitch = this.touchMoveY * 0.35;
    } else {
      // Mouse look con límites
      yaw   = THREE.MathUtils.clamp(this.mouseX * -0.55, -1.2, 1.2);
      pitch = THREE.MathUtils.clamp(this.mouseY * 0.45, -0.8, 0.8);
    }

    return { yaw, pitch };
  }

  isActionPressed(action = 'fire') {
    // Por ahora: Z, X, C o touch tap (futuro)
    return this.keys['z'] || this.keys['x'] || this.keys['c'] || (this.isTouchDevice && this.touchActive);
  }

  isTouch() {
    return this.isTouchDevice;
  }
}