# App Store submission notes

Everything you paste into App Store Connect, plus the notes that pre-empt the
likely review questions. GeoMaker collects no data, makes no network calls, has
no accounts/IAP/ads/tracking — which clears most common rejection reasons.

## App Privacy (nutrition label)

- **Data Not Collected.** Answer "No" to data collection across the board.
- **Privacy Policy URL:** the hosted `PRIVACY.md`
  (`https://github.com/BayouWebStudio/geomaker/blob/main/PRIVACY.md`, or your own
  domain / GitHub Pages URL). It's also shown in-app under **About & privacy**.

## Review notes (paste into "Notes for the reviewer")

> GeoMaker is a self-contained, on-device generative-art studio. There is no
> account, no login, and no network connection of any kind — every pattern is
> computed on the device in real time as you move the sliders, and you can shape
> several generators directly by touch (drag to comb the marbling ink, fracture
> the kintsugi ceramic, bend the fractal, spin the quasicrystal). Finished pieces
> are exported through the native iOS share sheet to Photos or Files. No demo
> account is required; all features are available immediately. The app collects
> and transmits no data.

(The notes deliberately emphasise the native, on-device, interactive nature to
address Guideline 4.2 minimum functionality, and the no-data/no-network nature
for the privacy review.)

## Listing copy

**Name:** GeoMaker

**Subtitle (≤30 chars):** Generative pattern studio

**Promotional text:** Endless organic, geometric, fractal and traditional
patterns — shaped live with your fingertips and saved straight to Photos.

**Description:**

> GeoMaker turns simple sliders into endless original art. Pick from 27 pattern
> engines, then move the levers and watch the artwork redraw instantly.
>
> • Organic — flow fields, reaction-diffusion, differential growth, Voronoi,
>   mycelium, ink marbling
> • Geometric & sacred — flower of life, mandalas, hex tilings, truchet, Islamic
>   girih, Celtic knots, phyllotaxis
> • Traditional — Japanese wagara, kumiko lattices, kintsugi, indigo shibori
> • Fractal — Mandelbrot & Julia, L-systems, the Apollonian gasket
>
> Shape it by touch: comb the marbling ink, fracture the kintsugi ceramic with a
> tap, bend a fractal, spin a quasicrystal. Every piece is built from a seed, so
> the art you love is reproducible — and you can save it to Photos or share it
> anytime.
>
> • 27 pattern engines, each with its own live controls
> • 18 palettes, from black-and-grey graphite to neon — or desaturate any of them
> • Paper-grain and vignette finishing
> • Works completely offline. No account, no ads, no tracking, no data collected.

**Keywords (≤100 chars):**
`generative,pattern,wallpaper,mandala,fractal,art,sacred geometry,marbling,kintsugi,truchet,design`

**What's New (first release):** First release.

## Screenshots

Use real in-app captures (App Store requires actual usage, not splash/title art).
The repo's `screenshots/` folder has plenty — e.g. the mono Flower of Life,
mandala, kintsugi, suminagashi, girih and Mandelbrot shots. Capture at the
required device sizes (6.7" iPhone + 13" iPad) from the running app or simulator.

## Pre-submit checklist

- [ ] Privacy Policy URL set in App Store Connect (and reachable).
- [ ] App Privacy = **Data Not Collected**.
- [ ] Description/keywords mention **no other platforms** (no "web", "Android",
      "PWA" — those belong in the repo, not the listing).
- [ ] Screenshots are real app captures at 6.7" iPhone and 13" iPad sizes.
- [ ] Run once on an **iPad simulator** — confirm the panel/canvas lay out and
      the share sheet works.
- [ ] Version 1.0 / Build 1 set on the App target.
- [ ] `ITSAppUsesNonExemptEncryption` is already `false` (no compliance prompt).

## Known-good answers to common review flags

- **4.2 minimum functionality:** on-device generation + touch interaction +
  native share/save + fully offline (see review notes).
- **4.3 spam (wallpaper is a saturated category):** 27 distinct algorithms with
  live parametric control is the "meaningfully different/improved" experience.
- **5.1.1 privacy:** policy hosted + in-app; nothing collected.
- **2.1 completeness:** no placeholder/debug content; every control works; the
  Share button uses the native sheet (not a dead internal link).
