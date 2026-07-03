# App Store submission notes

Everything you paste into App Store Connect, plus the notes that pre-empt the
likely review questions. GeoMaker collects no data, makes no network calls, has
no accounts/IAP/ads/tracking — which clears most common rejection reasons.

## App Information (paste into App Store Connect)

Shared with the Vesica Studio listing (same developer account).

| Field | Value |
|---|---|
| App name | **GeoMaker** |
| Subtitle | **Generative pattern studio** |
| Developer / Seller | **Vesica Studio** (Wesche Tattoo) |
| Bundle ID | `com.bayouwebstudio.geomaker` |
| Primary category | Graphics & Design |
| Secondary category | Entertainment |
| Support URL | **https://vesica.studio** |
| Marketing URL (optional) | **https://vesica.studio** |
| Privacy Policy URL | **https://github.com/BayouWebStudio/geomaker/blob/main/PRIVACY.md** |
| Support email (App Review contact) | **support@vesica.studio** |
| Price | Free (with a one-time in-app purchase) |
| In-App Purchase | **GeoMaker Pro Unlock** — non-consumable, `com.bayouwebstudio.geomaker.pro`, **$5.99** |

(If you'd rather a branded privacy URL, host `PRIVACY.md` at e.g.
`https://vesica.studio/geomaker-privacy.html` and use that instead — the in-app
About panel already links the GitHub copy.)

## In-App Purchase setup (App Store Connect)

The app is free with 4 free patterns; everything else is behind a **one-time
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
> account is required. Four patterns are free to use in full; the remaining
> patterns are unlocked by a single non-consumable purchase ("GeoMaker Pro
> Unlock", $5.99) processed entirely through StoreKit — the unlock sheet
> (reached by tapping any locked pattern) contains the required **Restore
> Purchase** button, which is also available under About. The app collects
> and transmits no data; purchases are handled by the App Store.

(The notes deliberately emphasise the native, on-device, interactive nature to
address Guideline 4.2 minimum functionality, and the no-data/no-network nature
for the privacy review.)

## Listing copy

**Name:** GeoMaker

**Subtitle (≤30 chars):** Generative pattern studio

**Promotional text:** Endless organic, geometric, fractal and traditional
patterns — shaped live with your fingertips and saved straight to Photos.

**Description:**

> GeoMaker turns simple sliders into endless original art. Pick from 59 pattern
> engines, then move the levers and watch the artwork redraw instantly.
>
> • Organic — flow fields, reaction-diffusion, differential growth, Voronoi,
>   mycelium, ink marbling, terrazzo stone
> • Geometric & sacred — flower of life, mandalas, hex tilings, truchet, Islamic
>   girih, Celtic knots, phyllotaxis
> • Wallpaper classics — polka-dot & motif wallpapers, stripes & chevrons,
>   herringbone parquet, fish scales, low-poly mesh, circuit boards
> • Mathematical — Penrose aperiodic tiling, Archimedean tessellations, op art,
>   spirograph, mazes & the Hilbert curve, Greek key frets
> • Traditional — Japanese wagara, sayagata & asanoha lattices, bishamon
>   armor, kumiko, kintsugi, indigo shibori, irezumi wave-and-cloud
>   backgrounds, chrysanthemum & sakura florals
> • Fractal — Mandelbrot & Julia, L-systems, the Apollonian gasket
>
> Shape it by touch: comb the marbling ink, fracture the kintsugi ceramic with a
> tap, bend a fractal, spin a quasicrystal. Every piece is built from a seed, so
> the art you love is reproducible — and you can save it to Photos or share it
> anytime.
>
> • 59 pattern engines, each with its own live controls
> • 18 palettes, from black-and-grey graphite to neon — or desaturate any of them
> • Line-weight control on every pattern, from hairline to bold marker
> • Paper-grain and vignette finishing
> • Works completely offline. No account, no ads, no tracking, no data collected.
>
> Four patterns are free, full-featured, forever. One single purchase unlocks
> all the rest — no subscription.

**Keywords (≤100 chars):**
`generative,pattern,wallpaper,mandala,fractal,art,sacred geometry,marbling,kintsugi,truchet,design`

**What's New (first release):** First release.

## Screenshots

Ready to upload — real in-app captures at the exact required sizes, in
`screenshots/appstore/`:

- **iPhone 6.7"** — `1290 × 2796` (PNG, no alpha): `iphone-1-flower`,
  `iphone-2-suminagashi`, `iphone-3-mandala`, `iphone-4-kintsugi`,
  `iphone-5-mandelbrot`.
- **iPad 13"** — `2048 × 2732`: `ipad-1-mandala`, `ipad-2-girih`,
  `ipad-3-truchet`.

These show actual usage (controls + artwork), not splash/title art, per
Guideline 2.3. Drag the matching set into each device size in App Store Connect.

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
- **4.3 spam (wallpaper is a saturated category):** 59 distinct algorithms with
  live parametric control is the "meaningfully different/improved" experience.
- **5.1.1 privacy:** policy hosted + in-app; nothing collected.
- **2.1 completeness:** no placeholder/debug content; every control works; the
  Share button uses the native sheet (not a dead internal link).
