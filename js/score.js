const KILL_LABELS = {
  basic:           ['OWNED!', 'REKT!', 'BYE!', 'DESTROYED!'],
  cosmic_communist:['COMMUNISM FAILED!', 'CAPITALISM WINS!', 'SENT TO GULAG!', 'MARX CRYING!'],
  woke_drone:      ['UN-WOKE!', 'DE-PLATFORMED!', 'RATIO\'D!', 'BASED!'],
  miniboss:        ['MINI-BOSS DOWN!', 'REGULATIONS GONE!', 'BUREAUCRAT SLAIN!'],
  finalboss:       ['MARS IS FREE!', 'BUREAUCRACY DESTROYED!', 'ELON WINS!'],
};

export class ScoreSystem {
  constructor() {
    this.score        = 0;
    this.multiplier   = 1;
    this.killStreak   = 0;
    this.multTimer    = 0;
    this.multDuration = 6;
    this.floatingTexts = [];

    this._container = document.createElement('div');
    this._container.style.cssText =
      'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:25;';
    document.body.appendChild(this._container);
  }

  /** Called when an enemy is killed. Returns points earned. */
  addKill(points, worldPos, camera, type = 'basic') {
    const earned = points * this.multiplier;
    this.score += earned;
    this.killStreak++;
    this.multiplier   = Math.min(8, 1 + Math.floor(this.killStreak / 3));
    this.multTimer    = this.multDuration;

    const labels = KILL_LABELS[type] || KILL_LABELS.basic;
    const label  = labels[Math.floor(Math.random() * labels.length)];
    this._spawnText(`+${earned}  ${label}`, worldPos, camera);
    return earned;
  }

  /** Reset multiplier on taking damage. */
  onDamage() {
    this.killStreak = 0;
    this.multiplier = 1;
    this.multTimer  = 0;
  }

  update(delta, camera) {
    if (this.multTimer > 0) {
      this.multTimer -= delta;
      if (this.multTimer <= 0) {
        this.multTimer  = 0;
        this.killStreak = 0;
        this.multiplier = 1;
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      if (ft.life <= 0) {
        ft.el.remove();
        this.floatingTexts.splice(i, 1);
        continue;
      }
      // drift upward
      ft.screenY -= 55 * delta;
      ft.el.style.top     = ft.screenY + 'px';
      ft.el.style.opacity = (ft.life / ft.maxLife).toFixed(3);
    }
  }

  spawnText(text, worldPos, camera) { this._spawnText(text, worldPos, camera); }

  _spawnText(text, worldPos, camera) {
    // Project world position to normalised device coords
    const ndc = worldPos.clone().project(camera);
    // Skip if behind camera
    if (ndc.z > 1) return;

    const x = (ndc.x + 1) * 0.5 * window.innerWidth;
    const y = (1 - (ndc.y + 1) * 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position:absolute;
      left:${x.toFixed(0)}px;
      top:${y.toFixed(0)}px;
      transform:translateX(-50%);
      color:#ffe000;
      font-family:monospace;
      font-size:clamp(0.9rem,2.2vw,1.5rem);
      font-weight:900;
      text-shadow:0 0 10px #ff8800, 0 2px 4px #000;
      pointer-events:none;
      white-space:nowrap;
      letter-spacing:0.04em;
    `;
    this._container.appendChild(el);

    const maxLife = 1.4;
    this.floatingTexts.push({ el, screenY: y, life: maxLife, maxLife });
  }

  getScore()      { return this.score; }
  getMultiplier() { return this.multiplier; }
  getMultTimer()  { return this.multTimer; }

  destroy() {
    this._container.remove();
  }
}
