# Shipping GeoMaker as an iOS app

GeoMaker is wrapped with [Capacitor](https://capacitorjs.com/): a thin native iOS
app loads the web app in a `WKWebView`, with native plugins for the share sheet,
file system, status bar and splash screen. The web app is the *same code* that
runs in the browser — Capacitor only adds the native shell.

The `ios/` Xcode project is **committed and ready**. Capacitor 8 wires plugins
through **Swift Package Manager**, so there is **no CocoaPods step**. The only
things left run on a **Mac with Xcode** (Apple's toolchain is macOS-only) — and
you already have an Apple Developer account, so signing is just picking your Team.

## Already done in this repo

- `ios/` Xcode project (committed) with app id `com.bayouwebstudio.geomaker`,
  display name **GeoMaker**, and the **branded Flower-of-Life app icon + splash**
  baked into the asset catalog (opaque, no alpha — App-Store-safe).
- `Info.plist` pre-set with `NSPhotoLibraryAddUsageDescription` (so "Save Image"
  works) and `ITSAppUsesNonExemptEncryption = false` (skips the export-compliance
  prompt on every upload).
- Native plugins via SPM: `@capacitor/ios`, `share`, `filesystem`, `status-bar`,
  `splash-screen`. `package-lock.json` committed.
- `npm run build:web` assembles the static app into `www/`; PNG export routes
  through the native iOS share sheet (Save to Photos / Files) when running in the
  app, and falls back to a browser download otherwise.
- iOS-aware web shell: `viewport-fit=cover`, no pinch/zoom, safe-area insets, no
  rubber-band scroll, light status bar.
- **In-app purchase**: `ios/App/App/GeoPayPlugin.swift` — a ~100-line StoreKit 2
  plugin (no third-party SDK) exposing `getProduct / purchase / restore /
  isUnlocked` to the web app as `Capacitor.Plugins.GeoPay`. It's already wired
  into the Xcode target. The product id it expects is
  `com.bayouwebstudio.geomaker.pro` (see APPSTORE.md for the App Store Connect
  setup, and `ios/App/Products.storekit` for local StoreKit testing in Xcode).
  If `GeoPay` ever comes back undefined in JS, check that `GeoPayPlugin.swift`
  is still a member of the App target (Target Membership in the File inspector).

## Build & run (on the Mac)

Prereqs: **Xcode** (+ Command Line Tools) and **Node 18+**. No CocoaPods needed.

```bash
npm install            # restores Capacitor + the CLI
npm run sync           # build:web + `cap sync ios` → fills in web assets & plugins
npm run ios:open       # opens ios/App in Xcode
```

In Xcode: select the **App** target → **Signing & Capabilities** → choose your
**Team** (Xcode manages the profile). Pick a simulator or device and press **▶ Run**.

> `cap sync` regenerates `ios/App/App/public` (the web assets, which are gitignored),
> so always run `npm run sync` after a fresh clone or any web change before building.

Test **⬇ Save** in the app — it opens the iOS share sheet so you can *Save Image*
to Photos or *Save to Files*.

## Bundle id — new app vs. your existing one

The project ships with `com.bayouwebstudio.geomaker`, intended as a **new** App
Store listing. Since you already have an approved app:

- **New listing (recommended):** in App Store Connect create a new app with this
  bundle id, then archive & upload.
- **Reuse/replace your existing app:** change the bundle id to that app's id in
  Xcode (App target → **Signing & Capabilities**, or **General → Identity**), then
  every new build updates that listing instead.

## Submitting to the App Store

1. App target → set **Version** (e.g. 1.0) and **Build** (e.g. 1).
2. **Product → Archive** → **Distribute App → App Store Connect**.
3. In [App Store Connect](https://appstoreconnect.apple.com): add screenshots,
   description, and privacy info. GeoMaker makes **no network calls and collects
   no data** — declare **"Data Not Collected."** (Encryption compliance is already
   answered via `ITSAppUsesNonExemptEncryption`.)

## Re-branding icons/splash (optional)

The icon + splash are already baked in. To regenerate every size from the source
art in `resources/icon.png` (1024²) and `resources/splash.png` (2732²):

```bash
npm i -D @capacitor/assets      # installs fine on macOS (uses sharp)
npx capacitor-assets generate --ios
```

## Notes & nice-to-haves

- **Orientation** is currently all-directions; lock it in the App target →
  **General → Device Orientation** if you want portrait-only.
- **Haptics:** `npm i @capacitor/haptics` then call `Haptics.impact()` on
  tap/drag in the interactive generators for a tactile feel.
- **Android** later: `npm i @capacitor/android && npx cap add android`.
- The same `www/` build is also an installable **PWA** (manifest + icons present),
  if you ever want an Add-to-Home-Screen route without Xcode.
