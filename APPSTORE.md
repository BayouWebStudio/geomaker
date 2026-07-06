# App Store submission notes

Everything you paste into App Store Connect, plus the notes that pre-empt the
likely review questions. GeoMaker collects no data, makes no network calls, has
no accounts/IAP/ads/tracking — which clears most common rejection reasons.

## App Information (paste into App Store Connect)

Shared with the Vesica Studio listing (same developer account).

| Field | Value |
|---|---|
| App name | **GeoMaker – Pattern Studio** (the bare name "GeoMaker" is taken on the App Store; the icon label stays **GeoMaker** via `CFBundleDisplayName`) |
| Subtitle | **Mandalas, waves & sacred art** (avoids repeating "pattern studio" from the name; adds search keywords) |
| Developer / Seller | **Vesica Studio** (Wesche Tattoo) |
| Bundle ID | `com.bayouwebstudio.geomaker` |
| Primary category | Graphics & Design |
| Secondary category | Entertainment |
| Support URL | **https://vesica.studio** |
| Marketing URL (optional) | **https://vesica.studio** |
| Privacy Policy URL | **https://vesica.studio/geomaker-privacy.html** (deploy `site/vesica.studio/geomaker-privacy.html` to the vesica-landing repo's `public/` folder first — see `site/vesica.studio/README.md`) |
| Support email (App Review contact) | **support@vesica.studio** |
| Price | Free (with a one-time in-app purchase) |
| In-App Purchase | **GeoMaker Pro Unlock** — non-consumable, `com.bayouwebstudio.geomaker.pro`, **$5.99** |

(If you'd rather a branded privacy URL, host `PRIVACY.md` at e.g.
`https://vesica.studio/geomaker-privacy.html` and use that instead — the in-app
About panel already links the GitHub copy.)

## In-App Purchase setup (App Store Connect)

The app is free with 11 free patterns; everything else is behind a **one-time
$5.99 unlock** (no subscription). Purchases run on StoreKit 2 directly via the
in-app `GeoPayPlugin.swift` — no third-party SDK, no server.

1. App Store Connect → your app → **Monetization → In-App Purchases** → **+**.
2. Type: **Non-Consumable**.
3. Reference Name: `GeoMaker Pro Unlock` · Product ID: `com.bayouwebstudio.geomaker.pro`
   (must match exactly — it's hardcoded in `GeoPayPlugin.swift`).
4. Price: **$5.99** (Apple maps the tier to other currencies automatically).
5. Localization (en-US): Display Name `GeoMaker Pro`, Description
   `Unlock all patterns, forever.`
6. Add the **review screenshot** (a capture of the in-app unlock sheet) and
   set the IAP's status to *Ready to Submit*.
7. On the app version page, under **In-App Purchases**, attach it — the first
   IAP must be submitted together with an app version.

**Local testing without App Store Connect:** in Xcode, Product → Scheme →
Edit Scheme… → Run → Options → **StoreKit Configuration** → select
`Products.storekit` (already in `ios/App/`). Purchases then run against a
local simulated store — buy, cancel and refund from Xcode's Transactions
inspector. For end-to-end sandbox testing, sign into a **Sandbox Apple ID**
(Users & Access → Sandbox Testers) on the device.

## App Privacy label — fill-in (Data Not Collected)

In App Store Connect → **App Privacy**:

1. "Do you or your third-party partners collect data from this app?" → **No, we
   do not collect data from this app.**
2. That's the whole flow — no data types, no tracking, no third-party SDKs to
   declare. (Accurate: GeoMaker makes no network requests and has no analytics,
   ads, accounts or tracking.)
3. Set the **Privacy Policy URL** above (also shown in-app under About & privacy).

## Review notes (paste into "Notes for the reviewer")

> GeoMaker is a self-contained, on-device generative-art studio. There is no
> account, no login, and no network connection of any kind — every pattern is
> computed on the device in real time as you move the sliders, and you can shape
> several generators directly by touch (drag to comb the marbling ink, fracture
> the kintsugi ceramic, bend the fractal, spin the quasicrystal). Finished pieces
> are exported through the native iOS share sheet to Photos or Files. No demo
> account is required. Eleven patterns are free to use in full (six touch-interactive); the remaining
> patterns are unlocked by a single non-consumable purchase ("GeoMaker Pro
> Unlock", $5.99) processed entirely through StoreKit — the unlock sheet
> (reached by tapping any locked pattern) contains the required **Restore
> Purchase** button, which is also available under About. The app collects
> and transmits no data; purchases are handled by the App Store.

(The notes deliberately emphasise the native, on-device, interactive nature to
address Guideline 4.2 minimum functionality, and the no-data/no-network nature
for the privacy review.)

## Listing copy

**Name:** GeoMaker – Pattern Studio

**Subtitle (≤30 chars):** Mandalas, waves & sacred art

**Promotional text (≤170 chars, editable anytime without review):**

> Comb the ink. Bloom the kiku. Bend the fractal. 59 living pattern engines
> under your fingertips — from irezumi waves to Penrose tilings. One tap saves
> it to Photos.

(164 chars. Alternates, both verified under the limit: "The pattern is
endless: 59 generative engines — irezumi waves, mandalas, Penrose tilings —
shaped live under your fingers and saved straight to Photos." (151) · "Endless
black & grey and full-color patterns. Touch the canvas: comb marbling ink,
stamp wave crests, spin kaleidoscopes. No account, no ads, works offline."
(156). Promotional text is the one listing field you can swap any time — reuse
it later for "New patterns added" announcements.)

**Description (paste as-is, 2,406 of 4,000 chars):**

> GeoMaker is a pattern studio that never runs dry. Pick one of 59 generative engines, move its levers, and watch original art redraw instantly — every piece grown from a seed, so anything you love can be brought back, tuned again, and saved to Photos in full resolution.
>
> TOUCH THE ART
> Twenty-five engines respond to your fingers. Comb floating ink like real suminagashi marbling. Tap wave crests and clouds into an irezumi background. Fracture kintsugi ceramic, then drag its shards while the gold seams reflow. Re-carve a maze from your fingertip, drag the focus of an op-art illusion, morph a living fractal. Turn on kaleidoscope symmetry and one drag becomes six.
>
> THE JAPANESE COLLECTION
> Made by a tattoo artist, GeoMaker goes unusually deep on classical Japanese pattern: sayagata and higaki frets, asanoha hemp-leaf, seigaiha waves, shippō, kikkō, kagome, yagasuri, uroko, ichimatsu, bishamon kikkō armor, matsukawabishi pine-bark, tatewaku rising steam, hanabishi, raimon thunder scrolls, kumiko lattices, kintsugi, indigo shibori, irezumi waves, clouds and mist, and kiku & sakura florals.
>
> AND EVERYTHING ELSE
> • Organic — flow fields, reaction-diffusion, differential growth, mycelium, Voronoi, terrazzo
> • Sacred & geometric — flower of life, mandalas, Metatron's cube, hex tilings, truchet, Islamic girih, Celtic knots
> • Wallpaper classics — polka-dot motifs, stripes & chevrons, herringbone parquet, fish scales, low-poly mesh, circuit boards
> • Mathematical — Penrose aperiodic tiling, Archimedean tessellations, spirograph, mazes & the Hilbert curve, Greek key frets, op art
> • Fractal — Mandelbrot & Julia, L-systems, the Apollonian gasket, strange attractors
>
> MAKE IT YOURS
> • 18 curated palettes, black & grey to neon — or desaturate any palette into greyscale
> • Line weight on every pattern, from hairline etching to bold marker
> • Paper grain and vignette finishing
> • Seeds: same seed, same art — copy a link that reproduces the exact piece
> • A favorites shelf that stores the full recipe of anything you make
> • Full-resolution PNG export through the share sheet
>
> Eleven patterns are free forever, fully featured — six of them touch-interactive. A single one-time purchase unlocks everything else — no subscription, ever.
>
> Private by design: no account, no ads, no tracking, no data collected. Works completely offline.
>
> From Vesica Studio — sibling to the Vesica sacred-geometry drawing app.

**Keywords (≤100 chars):**
`wallpaper,generative,fractal,irezumi,japanese,marbling,kintsugi,geometry,kaleidoscope,tattoo,seed`

(97 chars. Words already indexed from the name/subtitle — pattern, studio,
mandalas, waves, sacred, art — are deliberately not repeated.)

**What's New (first release):** First release.

## Screenshots

Ready to upload — real in-app captures at the exact required sizes, in
`screenshots/appstore/`:

Designed in the Vesica Studio family style — Cormorant Garamond headlines
(second line italic, in GeoMaker teal), JetBrains Mono kickers/footers, device
mockups, and one continuous irezumi wave strip flowing across the whole set so
the gallery reads as a single connected banner.

- **iPhone 6.7"** — `1290 × 2796` (PNG, no alpha), upload in this order:
  `iphone-1-cover` ("The pattern is endless."), `iphone-2-touch` ("Shape it
  by touch."), `iphone-3-japan` ("Old Japan, new ink."), `iphone-4-tune`
  ("Every lever, yours."), `iphone-5-forever` ("Yours, forever.").
- **iPad 13"** — `2048 × 2732`: `ipad-1-cover`, `ipad-2-japan`,
  `ipad-3-geometry`.

These show actual usage (controls + artwork), not splash/title art, per
Guideline 2.3. Drag the matching set into each device size in App Store Connect.

## Pre-submit checklist

- [ ] **Deploy the privacy page**: copy `site/vesica.studio/geomaker-privacy.html`
      into the vesica-landing repo's `public/` folder and deploy, so
      https://vesica.studio/geomaker-privacy.html is live.
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
- **4.3 spam (wallpaper is a saturated category):** 59 distinct algorithms with
  live parametric control is the "meaningfully different/improved" experience.
- **5.1.1 privacy:** policy hosted + in-app; nothing collected.
- **2.1 completeness:** no placeholder/debug content; every control works; the
  Share button uses the native sheet (not a dead internal link).
