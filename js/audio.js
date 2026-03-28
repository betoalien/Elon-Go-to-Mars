export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.engineOsc = null;
    this.engineGain = null;
    this._lastLaser = 0;
  }

  // Must be called from a user-gesture handler (click / keydown)
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.28;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      this._startEngineHum();
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
    }
  }

  _startEngineHum() {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.engineOsc  = osc;
    this.engineGain = gain;
  }

  /** Call each frame with current forwardSpeed so hum pitch scales. */
  setEngineSpeed(speed) {
    if (!this.initialized || !this.engineOsc) return;
    this.engineOsc.frequency.setTargetAtTime(40 + speed * 1.8, this.ctx.currentTime, 0.3);
  }

  playLaser() {
    if (!this.initialized) return;
    // throttle to avoid audio spam
    const now = this.ctx.currentTime;
    if (now - this._lastLaser < 0.14) return;
    this._lastLaser = now;

    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.10);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + 0.13);
  }

  playExplosion(size = 1) {
    if (!this.initialized) return;
    const dur     = 0.35 + size * 0.15;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer  = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
    }
    const src    = this.ctx.createBufferSource();
    src.buffer   = buffer;
    const gain   = this.ctx.createGain();
    gain.gain.value = 0.22 * Math.min(size, 2);
    const filter = this.ctx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 350 + size * 80;
    src.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    src.start();
  }

  playPowerUp() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.07;
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.2);
    });
  }

  playDamage() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + 0.36);
  }

  playBossAlert() {
    if (!this.initialized) return;
    const now   = this.ctx.currentTime;
    const freqs = [220, 277, 330, 277, 220, 165];
    freqs.forEach((f, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      const t = now + i * 0.18;
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.17);
    });
  }

  playChapterFanfare() {
    if (!this.initialized) return;
    const now   = this.ctx.currentTime;
    const freqs = [330, 392, 494, 659];
    freqs.forEach((f, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.27);
    });
  }

  playVictory() {
    if (!this.initialized) return;
    const now   = this.ctx.currentTime;
    const notes = [261, 329, 392, 523, 392, 523, 659, 784];
    notes.forEach((f, i) => {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = now + i * 0.16;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain); gain.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.5);
    });
  }

  stopEngine() {
    if (!this.initialized || !this.engineGain) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
  }
}
