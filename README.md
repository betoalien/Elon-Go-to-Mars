# Elon's Go to Mars

A browser-based 3D space shooter built with Three.js. Pilot Elon's Starship through 5,000 km of increasingly hostile space, blast through enemy fleets, collect power-ups, survive two boss encounters, and land on Mars.

**Play it now:** [elongotomars.albertocardenas.com](https://elongotomars.albertocardenas.com/)

---

## Gameplay

You fly forward automatically. Move and aim to dodge and destroy enemies. Reach Mars at 5,000 km — or die trying.

| Control | Action |
|---|---|
| `WASD` / Arrow keys | Move ship |
| Mouse | Aim / look |
| `Space` / `Z` / `X` / `C` | Fire laser |
| `R` | Restart after game over |

---

## Enemies

| Enemy | Points | Behaviour |
|---|---|---|
| Red Ship | 100 | Standard pursuer |
| Cosmic Communist | 250 | Zigzag attack pattern |
| Woke Drone | 500 | Tight homing; slows you on hit for 4 seconds |
| Mini-Boss | 2,000 | Armoured cruiser, 5 HP — appears at 800 km |
| Final Boss | 5,000 | Bureaucratic space station, 10 HP, fires projectiles in two phases — appears at 4,000 km |

Destroying the Final Boss triggers victory.

---

## Power-ups

Spinning octahedra that spawn every ~14 seconds.

| Power-up | Effect |
|---|---|
| Shield (cyan) | +50 shield |
| Turbo (yellow) | Speed ×1.6 for 6 seconds |
| Rapid Fire (purple) | Fire rate ×2 for 8 seconds |

---

## Score & Multiplier

- Kill streak builds a **×1–×8 multiplier** (resets on taking damage, decays after 6 seconds of no kills).
- Meme kill-text floats above destroyed enemies.
- High score is saved to `localStorage`.

---

## Chapters

The game is divided into four chapters, each increasing forward speed, enemy density, and changing the visual atmosphere.

| Chapter | Range | Speed |
|---|---|---|
| Deep Space | 0 – 800 km | 15 u/s |
| Asteroid Belt | 800 – 2,000 km | 22 u/s |
| Mars Approach | 2,000 – 4,000 km | 28 u/s |
| Boss Gauntlet | 4,000 – 5,000 km | 32 u/s |

---

## Running the Game

ES6 modules require an HTTP server — opening `index.html` directly via `file://` will be blocked by the browser.

**Option 1 — included Node.js server (no install needed):**
```bash
node server.js
# Open: http://localhost:3000
```

**Option 2 — VS Code Live Server extension:**
Right-click `index.html` → *Open with Live Server*, then open the `http://127.0.0.1:5500` URL.

**Option 3 — Python:**
```bash
python -m http.server 8080
# Open: http://localhost:8080
```

---

## Tech Stack

| | |
|---|---|
| 3D engine | [Three.js r134](https://threejs.org/) (CDN) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) (CDN) |
| Audio | Web Audio API (procedural, no audio files) |
| Build | None — vanilla ES6 modules, runs in any modern browser |

---

## Project Structure

```
elons_go_to_mars/
├── index.html          # Entry point + full UI (menu, HUD, overlays)
├── server.js           # Zero-dependency local HTTP server
├── js/
│   ├── main.js         # Game loop, state machine, collision, HUD wiring
│   ├── enemy.js        # All enemy classes + EnemyManager
│   ├── ship.js         # Player Starship geometry
│   ├── camera.js       # Third-person chase camera
│   ├── input.js        # Keyboard, mouse, and touch input
│   ├── lasers.js       # Laser object pool
│   ├── propulsion.js   # Engine exhaust particles
│   ├── stars.js        # Procedural starfield
│   ├── explosion.js    # Explosion particle system
│   ├── score.js        # Score, multiplier, floating kill text
│   ├── powerup.js      # Power-up spawning and effects
│   └── audio.js        # Procedural Web Audio sound system
└── images/
    └── elon_sad.png    # Damage feedback image
```
