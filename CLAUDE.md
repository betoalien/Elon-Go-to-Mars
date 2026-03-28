# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step required. Open `index.html` directly in a browser. Dependencies (Three.js r134, Tailwind CSS) are loaded from CDN — no `npm install` needed.

For local development, serve with any static file server to avoid ES6 module CORS issues:
```bash
python -m http.server 8080
# or
npx serve .
```

## Architecture Overview

This is a browser-based 3D space combat game using Three.js (r134) and ES6 modules. `main.js` is the orchestrator — it owns the game loop, scene, and wires all subsystems together.

### Module Responsibilities

| Module | Owns |
|--------|------|
| `main.js` | Three.js scene init, animation loop, collision detection, HUD updates, game-over logic |
| `ship.js` | Player ship geometry (Starship-like: cylinder body, cone nose, grid fins) — returns a `THREE.Group` |
| `camera.js` | Third-person chase camera with lerp smoothing (offset `(0,6,22)`, lerp `0.12`) |
| `input.js` | Unified desktop (WASD + mouse) and mobile (touch zones) input — exposes normalized state |
| `stars.js` | 12,000-point starfield with infinite scroll wrapping |
| `propulsion.js` | 400-particle engine exhaust (additive blending, yellow→red gradient) |
| `lasers.js` | Object pool of 20 cyan laser projectiles, 0.15s fire cooldown |
| `enemy.js` | `EnemyShip` class + `EnemyManager` pool (8 enemies); AI pursues player with 60/40 split toward ship vs forward |

### Game Loop Flow

1. Compute `delta` (seconds since last frame)
2. Read input state → update ship position (clamped: X `[-18,18]`, Y `[-12,12]`)
3. Move scene forward: `ship.position.z -= 15 * delta`
4. Update camera, stars, propulsion, enemies, lasers
5. Sphere-based collision checks: lasers vs enemies (radius 1.5), enemies vs ship (radius 4)
6. Apply damage (25 per hit, 1.5s cooldown), update HUD

### Progression System

Enemy difficulty scales with `distanceTraveled` (units × 0.1 = displayed km). Every 200 km: spawn interval drops toward 2s minimum, max active enemies increases by 0.5.

### Key Constants (all in `main.js`)

- Forward speed: `15` units/sec
- Shield: `100` max, no regen
- Ship movement multiplier: `0.25`
- Mouse look clamp: yaw `±1.2 rad`, pitch `±0.8 rad`

## Development Roadmap

`gaps.txt` tracks ~15 remaining features including: main menu, chapter system, enemy types (Cosmic Communist, Woke Drone), power-ups, floating damage text, sound system, mini-boss, final boss, high score via `localStorage`.
