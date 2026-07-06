# GeoMaker

**A pattern studio in your browser.** Fifty-nine generative-art algorithms — organic, geometric, fractal, traditional Japanese & world patterns, and hands-on interactive. The canvas is the whole app: a floating dock opens one sheet at a time — **Patterns** (a visual browser with live previews of every generator), **Style** (palette cards + finish: desaturate, paper grain, vignette) and **Tune** (the current pattern's levers) — with seeded randomness so every piece is reproducible, and one-tap PNG export. No build step, no dependencies — just open it.

![GeoMaker — Silk Flow](screenshots/hero.jpg)

## Running it

Any static file server works:

```bash
npm start            # python3 -m http.server 8123
# or: npx serve
```

Then open <http://localhost:8123>. (ES modules need http; opening `index.html` directly from disk won't work.)

### iOS app

GeoMaker is also wrapped as a native iOS app with [Capacitor](https://capacitorjs.com/) (a `WKWebView` shell + native share/save). The web app is iOS-aware (safe-area insets, no pinch-zoom, PNG export via the native share sheet). Build steps run on a Mac — see **[IOS.md](IOS.md)**. The same build doubles as an installable PWA (manifest + icons included).

The iOS build gates most patterns behind a **one-time StoreKit unlock** ($5.99, no subscription) with a small always-free tier (`FREE_ALGO_IDS` in `js/algos/index.js` — one line to change). The open web build has no gate.

## The algorithms

The **Patterns** sheet shows every generator as a live preview thumbnail (rendered
in your current palette), filterable by **Organic / Geometric / Fractal / Saved**.
Every generator shares the same machinery — seed, palette, finish controls, share
links and PNG export.

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
- **Pebbles** — organic circle packing drawn as noise-wobbled flat blobs: river stones, cells. Includes an "offset ink" misprint mode and outline-only mode.
- **Terrazzo** — café-floor stone: angular polygon chips dart-thrown into a grout field with a dusting of fine speckles; coverage, angularity, outline and three color treatments.
- **Contours** — a topographic map of a fractal noise landscape: smooth elevation bands plus marching-squares iso-lines, optionally drifting.
- **Dotwork** — weighted stippling: density-driven dot fields with an even-spacing pass, like hand-poked dotwork or engraving stipple.
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
- **Motif Wallpaper** — the classic phone-wallpaper recipe: dots, rings, stars, sparkles, hearts, moons, crosses, triangles or diamonds (or a seeded mix) on square, brick, diamond or scatter layouts, with spacing, jitter, rotation play, size variation and filled/outline control.
- **Stripes & Waves** — banded wallpaper: straight stripes, chevron zigzags, flowing wave ribbons or fish-scale rows, with direct band-width and fill-ratio levers, any angle, and a hand-wobble humanizer.
- **Parquet & Herringbone** — wood-floor tilings: true interlocking herringbone, chevron columns, running-bond brick and basket weave, with plank proportion, grout width and per-plank tone variation (flat or rotated 45°).
- **Tessellations** — the classic Archimedean tilings: triangle grids, trihexagonal star lattices, octagons-and-squares (4.8.8) and the hex–square–triangle mix (3.4.6.4), with a grout gap and per-shape coloring.
- **Penrose Tiling** — the famous aperiodic five-fold rhombus tiling (P3), generated by golden-ratio subdivision from a central sun; it never repeats at any scale.
- **Op Art** — bold optical illusions: bulging checkerboards, concentric rings, rotating square tunnels and Riley-style wavy line fields.
- **Maze & Path** — one continuous line fills the plane: a perfect maze carved by recursive backtracking, the Hilbert space-filling curve, or a hand wobbling spiral, with a palette gradient sweeping along the path.
- **Greek Key** — classical fret borders (key spirals, T-frets, stepped zigzags) running in banded rows between rails, like a vase or mosaic floor.
- **Spirograph** — gear-drawn hypotrochoid curves layered into guilloché engraving rosettes; wheel ratio and pen offset reshape the figure.
- **Circuit Board** — PCB traces with 45° bends that never cross, ending in pads and vias — tech wallpaper on dark palettes, blueprint linework on light ones.
- **Low-Poly Mesh** — the faceted-triangle wallpaper look: a jittered point cloud triangulated (Bowyer–Watson) and flat-shaded like cut glass.
- **Phyllotaxis** *(interactive)* — a sunflower seed-head at the golden angle (Vogel's model). Drag ↔ to detune the divergence angle and watch the spiral arms reorganize, ↕ to change the spacing.
- **Moiré** *(interactive)* — interference fringes from two overlaid gratings (concentric rings or parallel lines). Drag to move the second layer and shimmer the moiré.
- **Islamic Girih** — Islamic geometric star patterns: interlocking {n/m} star polygons (8-, 10- or 12-point) on interleaved grids, forming the classic star-and-cross strapwork.
- **Celtic Knot** — interlaced plaitwork: woven cords that pass over and under by parity, on a straight or diagonal weave.
- **Cellular Automata** — elementary 1D rules drawn as a space-time triangle (Rule 30/90/110…), or a 2D cyclic automaton that self-organizes into spiral waves.
- **Quasicrystal** *(interactive)* — many plane waves overlaid into a quasiperiodic interference lattice with N-fold symmetry. Drag to spin and phase-shift it.
- **Cymatics** *(interactive)* — Chladni plate figures: sand settling on the nodal lines of a vibrating plate. Drag to sweep the two frequencies.
- **Harmonograph** *(interactive)* — the damped-pendulum drawing machine (lateral/rotary), plus guilloché engraving rings; draws itself progressively like a pen. Drag to detune.
- **Sacred Geometry II** — Metatron's Cube (13 circles, all 78 connections), the Vesica Piscis construction, and a recursively nested Merkaba.
- **Textile Weave** — woven cloth: tartan plaid (crossing warp/weft threads), argyle diamonds with overstitch, or houndstooth check.

### Fractal

| | |
|---|---|
| ![Mandelbrot](screenshots/geo-mandelbrot.jpg) | ![L-system plant](screenshots/geo-lsystem.jpg) |
| ![Apollonian gasket](screenshots/geo-apollonian.jpg) | |

- **Mandelbrot / Julia** *(interactive)* — the escape-time fractal, smooth-shaded. Drag to pan the Mandelbrot, or switch to Julia and drag to morph the seed; zoom and iteration sliders go deep.
- **L-system** *(interactive)* — Lindenmayer rewrite grammars drawn with a turtle: fractal plants, bushes, the Koch curve, the dragon curve and Sierpinski. Drag to bend the branching angle.
- **Apollonian Gasket** — infinitely nested mutually-tangent circles, filled via the Descartes Circle Theorem.
- **Strange Attractor** *(interactive)* — a chaotic map (Clifford / de Jong) iterated millions of times into smoke-like filaments. Drag to bend the parameters.

## Interactive patterns (tap & drag)

Fifteen generators respond to the pointer — drag right on the canvas (mouse or touch):

| | |
|---|---|
| ![Suminagashi](screenshots/geo-suminagashi.jpg) | ![Suminagashi, combed by dragging](screenshots/geo-suminagashi-combed.jpg) |

- **Suminagashi** (ink marbling) — each drop is an area-preserving map that expands the existing ink outward into concentric rings; combing shears them into waves. **Tap** to drop ink, **drag** to comb the surface (the right-hand image above is the left one after a few drags).
- **Kintsugi** — tap to strike a fracture, drag to paint a gold vein (see below).
- **Shibori** — kanoko: drag to print resist; arashi/itajime: drag to fold & angle (see below).
- **Voronoi Cells** — tap to add a cell, drag to move the nearest.
- **Phyllotaxis** — drag to detune the angle / spacing.
- **Moiré** — drag to move the second grating.
- **Irezumi Waves & Clouds** — tap to stamp another crest, cloud or mist band in front of the field.
- **Maze & Path** — drag to bend the whole path through a magnifying lens that follows your finger.
- **Op Art** — drag to move the focal point of the illusion (the bulge, ring centre, tunnel vanishing point or wave phase).

**Touch symmetry (kaleidoscope input):** the Style sheet has a symmetry control (2× to 12×) that replays your touch around the canvas centre — one drag combs the marbling in six places at once; one tap strikes six mirrored kintsugi fractures. Works on Suminagashi, Kintsugi, Voronoi and Shibori.

**Favorites:** ♥ in the top bar (or `f`) saves the current piece — seed, palette and every slider — to the **Saved** shelf inside the Patterns sheet, reloadable anytime.

Interactive generators carry a `✦ touch` badge on their preview card, and the Tune sheet shows a hint for the current one. (Interactions are live and ephemeral — they aren't captured in the share link, which reproduces the seeded starting state.)

## Japanese patterns (和柄)

A family of traditional Japanese designs, from precise *wagara* tilings to interactive *kintsugi* and *shibori*.

| | |
|---|---|
| ![Seigaiha](screenshots/geo-seigaiha.jpg) | ![Asanoha](screenshots/geo-asanoha.jpg) |
| ![Kintsugi](screenshots/geo-kintsugi.jpg) | ![Shibori kanoko](screenshots/geo-shibori.jpg) |
| ![Kumiko](screenshots/geo-kumiko.jpg) | |

- **The wagara classics — each its own pattern** with focused levers: **Seigaiha (青海波)** nested ocean-wave shells, **Shippō (七宝)** linked "seven treasures" circles, **Kikkō (亀甲)** tortoiseshell hexagons, **Kagome (籠目)** triaxial basket weave, **Yagasuri (矢絣)** arrow-feather columns, **Uroko (鱗)** scale triangles and **Ichimatsu (市松)** the kabuki checkerboard.
- **Kumiko (組子)** — the wooden shoji lattice: a square *jigumi* grid filled with fine muntin patterns (masu / diagonal star / kaku-asa square-hemp-leaf), with an optional wood-bevel highlight.
- **Kintsugi (金継ぎ)** *(interactive)* — broken ceramic mended with metal. Voronoi shards filled as glaze, their seams stroked as gold/silver/copper veins. Tap to strike a new fracture, drag to paint a vein across the surface.
- **Shibori (絞り)** *(interactive)* — indigo resist tie-dye: *kanoko* fawn-spots, *arashi* pole-wrap diagonals, *itajime* folded-clamp grid, all with soft dye-bleed edges. Drag to print resist or set the fold.
- **Sayagata (紗綾形)** — the interlocking-manji key fret of kimono silk and irezumi backgrounds, built from a linked 卍 lattice with Z-step joins (plus a tight *higaki* weave variant), set on the 45° diagonal.
- **Asanoha (麻の葉)** — a dedicated hemp-leaf star lattice with kumiko-style double-line joinery, rotation and scattered accent fills.
- **Five more, also standalone:** **Bishamon Kikkō (毘沙門亀甲)** the three-hex armor trefoil, **Matsukawabishi (松皮菱)** pine-bark diamonds, **Tatewaku (立涌)** rising steam, **Hanabishi (花菱)** flower diamonds and **Raimon (雷文)** thunder scrolls.
- **Irezumi Waves & Clouds** *(interactive)* — the tattoo backgrounds: *nami* waves with spiral curls and foam fingers, *kumo* scallop clouds with concentric echo lines, *kasumi* stepped mist. Tap the canvas to stamp another crest, cloud or mist band exactly where you want it.
- **Kiku & Sakura** — Japanese florals: layered chrysanthemum blooms, falling notched sakura petals, round ume blossoms with stamens.

## Finish (make it illustrative)

Global post-processing in the Style sheet, applied to every algorithm:

- **Saturation** (0–1.5) — pull any palette toward muted, print-like tones, or fully grayscale; the palette cards preview the adjustment live.
- **Line weight** (0.3×–3×) — thicken or thin every stroke the current pattern draws, from hairline etching to bold marker, on all fifty-nine generators.
- **Paper grain** — seeded film-grain overlay for a printed/risograph texture.
- **Vignette** — soft darkened edges for a vintage plate look.

All of these are baked into PNG exports and encoded in share links. Desaturated Botanic + grain + vignette, for example:

![Illustrative look](screenshots/illustrative.jpg)

## Controls

The dock (bottom) is the whole navigation: **Patterns · Style · [dice] · Tune · Save**.
Sheets open over the live canvas, so everything you change redraws behind them.

- **Patterns** (g) — the visual browser: every generator as a preview card, plus your Saved pieces.
- **Style** — palette cards + the Finish sliders. 18 curated palettes; opens on monochrome **Graphite**, with **Noir**, **Silver**, **Slate**, **Ink** and **Chalk** all black/grey and colour palettes (Abyss, Ember, Riso Pop, Neon Garden…) one tap away. The **Saturation** lever also turns *any* palette fully grayscale.
- **Dice** (space) — surprise me: new seed + random palette.
- **Tune** — the current pattern's seed and levers, live; plus **Redraw** (r), **Pause/Resume** (p) and **Copy link** (c) — a URL that encodes algorithm, seed, palette and every slider, so a link reproduces the exact piece.
- **Save** (s) — the canvas as a PNG at full device resolution (native share sheet on iOS).
- **Seed** — every artwork is deterministic. Same seed + same settings = same art. Type anything, or roll the dice.
- Top bar: **♥** favorite (f) · **⛶** hide the chrome for a full-bleed view (h) · **ⓘ** about.

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

Adding an algorithm = one new file in `js/algos/` exporting `{ id, name, description, params, create() }` (plus an optional `category` of `'Organic'`, `'Geometric'` or `'Fractal'` for grouping, and `symmetry: true` to receive kaleidoscope-mirrored pointer input), and one import in `js/algos/index.js`. The `create()` function receives `{ ctx, width, height, rng, noise, palette, params }` and returns `{ frame() }`; return `false` from `frame()` when the piece is finished (static patterns just draw once and return `false`).

To make a generator **interactive**, set `interactive: true` and a `hint` string on the export, return `true` from `frame()` to stay live (redraw on a dirty flag so it's idle when nothing changes), and add any of `onDown(x, y)`, `onMove(x, y, dx, dy)`, `onUp(x, y, dragDist)` to the object returned by `create()`. The shell feeds it canvas-space pointer coordinates (mouse and touch).
