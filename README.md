# GeoMaker

**A pattern studio in your browser.** Twenty-seven generative-art algorithms — organic, geometric, fractal, traditional Japanese & world patterns, and hands-on interactive — a panel full of levers, global look controls (desaturate, paper grain, vignette), seeded randomness so every piece is reproducible, and one-click PNG export. No build step, no dependencies — just open it.

![GeoMaker — Silk Flow](screenshots/hero.jpg)

## Running it

Any static file server works:

```bash
npm start            # python3 -m http.server 8123
# or: npx serve
```

Then open <http://localhost:8123>. (ES modules need http; opening `index.html` directly from disk won't work.)

## The algorithms

The dropdown groups generators into **Organic** and **Geometric**. Every generator
shares the same machinery — seed, palette, Look controls, share links and PNG export.

### Organic

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
- **Voronoi Cells** *(interactive)* — a mosaic of nearest-neighbour cells (cracked glass, scales, stone) built by exact half-plane clipping, with Lloyd relaxation for evenness. Tap to add a cell, drag to move the nearest one.

### Geometric (sacred geometry & tilings)

| | |
|---|---|
| ![Flower of Life](screenshots/geo-flower.jpg) | ![Mandala](screenshots/geo-mandala.jpg) |
| ![Hex Wallpaper — cubes](screenshots/geo-hexcubes.jpg) | ![Hex Wallpaper — rosette](screenshots/geo-hexrosette.jpg) |
| ![Truchet — arcs](screenshots/geo-truchet.jpg) | ![Phyllotaxis](screenshots/geo-phyllotaxis.jpg) |
| ![Islamic Girih](screenshots/geo-girih.jpg) | ![Celtic Knot](screenshots/geo-celtic.jpg) |
| ![Quasicrystal](screenshots/geo-quasicrystal.jpg) | ![Cellular Automata — Rule 30](screenshots/geo-automata.jpg) |

- **Flower of Life** — the classic sacred-geometry lattice of equal circles whose centers sit one radius apart, blooming into vesica-piscis petals. Levers: rings of circles, radius, rotation, boundary ring + clip, stained-glass fill, color-by-ring/angle.
- **Hex Wallpaper** — hexagonal tiling with four motifs: solid honeycomb, nested concentric hexagons, isometric cubes (3-rhombi shading), and a six-petal rosette in every cell. Levers: motif, hex size, flat/pointy orientation, gap, nested count, color mode, per-tile color variation.
- **Mandala** — kaleidoscopic rings of repeating motifs (petals, beads, diamonds, scallops…) with adjustable N-fold symmetry, ring count, mirroring and fill. The seed picks the per-ring motifs, so every seed is a different — but always symmetric — mandala.
- **Truchet** — randomly oriented tiles that knit into flowing weaves, mazes and op-art. Styles: quarter-arcs, diagonals, two-tone triangles, plus an optional multi-scale subdivide for varied density.
- **Phyllotaxis** *(interactive)* — a sunflower seed-head at the golden angle (Vogel's model). Drag ↔ to detune the divergence angle and watch the spiral arms reorganize, ↕ to change the spacing.
- **Moiré** *(interactive)* — interference fringes from two overlaid gratings (concentric rings or parallel lines). Drag to move the second layer and shimmer the moiré.
- **Islamic Girih** — Islamic geometric star patterns: interlocking {n/m} star polygons (8-, 10- or 12-point) on interleaved grids, forming the classic star-and-cross strapwork.
- **Celtic Knot** — interlaced plaitwork: woven cords that pass over and under by parity, on a straight or diagonal weave.
- **Cellular Automata** — elementary 1D rules drawn as a space-time triangle (Rule 30/90/110…), or a 2D cyclic automaton that self-organizes into spiral waves.
- **Quasicrystal** *(interactive)* — many plane waves overlaid into a quasiperiodic interference lattice with N-fold symmetry. Drag to spin and phase-shift it.
- **Textile Weave** — woven cloth: tartan plaid (crossing warp/weft threads), argyle diamonds with overstitch, or houndstooth check.

### Fractal

| | |
|---|---|
| ![Mandelbrot](screenshots/geo-mandelbrot.jpg) | ![L-system plant](screenshots/geo-lsystem.jpg) |
| ![Apollonian gasket](screenshots/geo-apollonian.jpg) | |

- **Mandelbrot / Julia** *(interactive)* — the escape-time fractal, smooth-shaded. Drag to pan the Mandelbrot, or switch to Julia and drag to morph the seed; zoom and iteration sliders go deep.
- **L-system** *(interactive)* — Lindenmayer rewrite grammars drawn with a turtle: fractal plants, bushes, the Koch curve, the dragon curve and Sierpinski. Drag to bend the branching angle.
- **Apollonian Gasket** — infinitely nested mutually-tangent circles, filled via the Descartes Circle Theorem.

## Interactive patterns (tap & drag)

Six generators respond to the pointer — drag right on the canvas (mouse or touch):

| | |
|---|---|
| ![Suminagashi](screenshots/geo-suminagashi.jpg) | ![Suminagashi, combed by dragging](screenshots/geo-suminagashi-combed.jpg) |

- **Suminagashi** (ink marbling) — each drop is an area-preserving map that expands the existing ink outward into concentric rings; combing shears them into waves. **Tap** to drop ink, **drag** to comb the surface (the right-hand image above is the left one after a few drags).
- **Kintsugi** — tap to strike a fracture, drag to paint a gold vein (see below).
- **Shibori** — kanoko: drag to print resist; arashi/itajime: drag to fold & angle (see below).
- **Voronoi Cells** — tap to add a cell, drag to move the nearest.
- **Phyllotaxis** — drag to detune the angle / spacing.
- **Moiré** — drag to move the second grating.

A `✦` hint appears in the panel whenever the selected generator is interactive. (Interactions are live and ephemeral — they aren't captured in the share link, which reproduces the seeded starting state.)

## Japanese patterns (和柄)

A family of traditional Japanese designs, from precise *wagara* tilings to interactive *kintsugi* and *shibori*.

| | |
|---|---|
| ![Seigaiha](screenshots/geo-seigaiha.jpg) | ![Asanoha](screenshots/geo-asanoha.jpg) |
| ![Kintsugi](screenshots/geo-kintsugi.jpg) | ![Shibori kanoko](screenshots/geo-shibori.jpg) |
| ![Kumiko](screenshots/geo-kumiko.jpg) | |

- **Wagara (和柄)** — eight classic patterns in one generator, switched by a dropdown: **seigaiha** (blue ocean waves), **asanoha** (hemp-leaf star lattice), **shippō** (linked "seven treasures" circles), **kikkō** (tortoiseshell hexagons), **kagome** (basket weave), **yagasuri** (arrow feathers), **uroko** (scales) and **ichimatsu** (checkerboard). Shared scale / line-width / two-tone-or-gradient levers.
- **Kumiko (組子)** — the wooden shoji lattice: a square *jigumi* grid filled with fine muntin patterns (masu / diagonal star / kaku-asa square-hemp-leaf), with an optional wood-bevel highlight.
- **Kintsugi (金継ぎ)** *(interactive)* — broken ceramic mended with metal. Voronoi shards filled as glaze, their seams stroked as gold/silver/copper veins. Tap to strike a new fracture, drag to paint a vein across the surface.
- **Shibori (絞り)** *(interactive)* — indigo resist tie-dye: *kanoko* fawn-spots, *arashi* pole-wrap diagonals, *itajime* folded-clamp grid, all with soft dye-bleed edges. Drag to print resist or set the fold.

## The Look panel (make it illustrative)

Global post-processing that applies to every algorithm:

- **Saturation** (0–1.5) — pull any palette toward muted, print-like tones, or fully grayscale; swatches preview the adjustment live.
- **Paper grain** — seeded film-grain overlay for a printed/risograph texture.
- **Vignette** — soft darkened edges for a vintage plate look.

All three are baked into PNG exports and encoded in share links. Desaturated Botanic + grain + vignette, for example:

![Illustrative look](screenshots/illustrative.jpg)

## Controls

- **Seed** — every artwork is deterministic. Same seed + same settings = same art. Type anything, or roll the dice.
- **Palettes** — 18 curated palettes. Opens on monochrome **Graphite**; **Noir**, **Silver**, **Slate**, **Ink** and **Chalk** are all black/grey, with colour palettes (Abyss, Ember, Riso Pop, Neon Garden…) one click away. The **Saturation** lever (below) also turns *any* palette fully grayscale.
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

Adding an algorithm = one new file in `js/algos/` exporting `{ id, name, description, params, create() }` (plus an optional `category` of `'Organic'` or `'Geometric'` for the dropdown grouping), and one import in `js/algos/index.js`. The `create()` function receives `{ ctx, width, height, rng, noise, palette, params }` and returns `{ frame() }`; return `false` from `frame()` when the piece is finished (static patterns just draw once and return `false`).

To make a generator **interactive**, set `interactive: true` and a `hint` string on the export, return `true` from `frame()` to stay live (redraw on a dirty flag so it's idle when nothing changes), and add any of `onDown(x, y)`, `onMove(x, y, dx, dy)`, `onUp(x, y, dragDist)` to the object returned by `create()`. The shell feeds it canvas-space pointer coordinates (mouse and touch).
