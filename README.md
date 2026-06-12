# GeoMaker

**An organic pattern studio in your browser.** Seven generative-art algorithms, a panel full of levers, global look controls (desaturate, paper grain, vignette), seeded randomness so every piece is reproducible, and one-click PNG export. No build step, no dependencies — just open it.

![GeoMaker — Silk Flow](screenshots/hero.jpg)

## Running it

Any static file server works:

```bash
npm start            # python3 -m http.server 8123
# or: npx serve
```

Then open <http://localhost:8123>. (ES modules need http; opening `index.html` directly from disk won't work.)

## The algorithms

| | |
|---|---|
| ![Coral Growth](screenshots/coral.jpg) | ![Turing Patterns](screenshots/turing.jpg) |
| ![Ridgelines](screenshots/ridge.jpg) | ![Mycelium](screenshots/mycelium.jpg) |
| ![Pebbles](screenshots/pebbles.jpg) | ![Contours](screenshots/contours.jpg) |

- **Silk Flow** — thousands of particles ride a layered Perlin noise field; their low-alpha trails accumulate into silky ribbons. Levers: particle count, noise scale, swirl, speed, ink opacity/amount, color mapping, edge behavior.
- **Coral Growth** — differential growth: a loop of nodes that attract their neighbors, repel everything nearby, and split stretched edges, buckling like coral or brain tissue. Watch it grow live, with optional onion-skin trails (growth rings).
- **Turing Patterns** — Gray-Scott reaction-diffusion on a torus. Presets for coral / mitosis / worms / maze / solitons, plus raw feed & kill sliders, seeding styles and banded rendering.
- **Ridgelines** — stacked noise-displaced ridge lines with occlusion fills, like mountain strata or a topographic record. Can animate with a slow drift.
- **Mycelium** — branching, self-avoiding random walkers that wander, fork, taper and die when they touch existing growth: roots, lightning, fungal nets.
- **Pebbles** — organic circle packing drawn as noise-wobbled flat blobs: terrazzo, river stones, cells. Includes an "offset ink" misprint mode and outline-only mode.
- **Contours** — a topographic map of a fractal noise landscape: smooth elevation bands plus marching-squares iso-lines, optionally drifting.

## The Look panel (make it illustrative)

Global post-processing that applies to every algorithm:

- **Saturation** (0–1.5) — pull any palette toward muted, print-like tones, or fully grayscale; swatches preview the adjustment live.
- **Paper grain** — seeded film-grain overlay for a printed/risograph texture.
- **Vignette** — soft darkened edges for a vintage plate look.

All three are baked into PNG exports and encoded in share links. Desaturated Botanic + grain + vignette, for example:

![Illustrative look](screenshots/illustrative.jpg)

## Controls

- **Seed** — every artwork is deterministic. Same seed + same settings = same art. Type anything, or roll the dice.
- **Palettes** — 14 curated palettes from plotter-style ink on cream to neon on black.
- **Tuning** — every algorithm exposes its parameters as live sliders/selects; changes re-render immediately.
- **🎲 Surprise me** (space) — new seed + random palette.
- **⬇ Save** (s) — downloads the canvas as a PNG at full device resolution.
- **🔗 Share** (c) — copies a URL that encodes algorithm, seed, palette and every slider, so a link reproduces the exact piece.
- **⏸ / ▶** (p) — pause and resume the simulations; **↺** (r) replays the current piece.
- **h** — hide the panel for a full-bleed view.

State also persists to `localStorage`, so reloading brings back your last session.

## Project layout

```
index.html          app shell
css/style.css       UI styling
js/main.js          canvas lifecycle, render loop, hash/share/export
js/ui.js            schema -> controls renderer
js/core/            seeded rng, perlin noise + fbm, palettes, color utils
js/algos/           one module per algorithm, registered in index.js
test/smoke.mjs      node smoke tests for the DOM-free modules (npm test)
```

Adding an algorithm = one new file in `js/algos/` exporting `{ id, name, description, params, create() }`, plus one import in `js/algos/index.js`. The `create()` function receives `{ ctx, width, height, rng, noise, palette, params }` and returns `{ frame() }`; return `false` from `frame()` when the piece is finished.
