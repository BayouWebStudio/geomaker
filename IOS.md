# Shipping GeoMaker as an iOS app

GeoMaker is wrapped with [Capacitor](https://capacitorjs.com/): a thin native iOS
app loads the web app in a `WKWebView`, with native plugins for the share sheet,
file system, status bar and splash screen. The web app stays 100% the same code
that runs in the browser — Capacitor only adds the native shell.

Everything in this repo is already configured. The remaining steps **must run on
a Mac** (Apple's toolchain is macOS-only) and need an **Apple Developer Program**
membership ($99/year) to install on a device or submit to the App Store.

## What's already done (in this repo)

- `capacitor.config.json` — app id `com.bayouwebstudio.geomaker`, name `GeoMaker`,
  `webDir: www`, dark background, splash config.
- Native plugins installed: `@capacitor/ios`, `share`, `filesystem`,
  `status-bar`, `splash-screen` (+ `@capacitor/cli` dev).
- `npm run build:web` assembles the static app into `www/` (Capacitor's webDir).
- App icon + splash source art in `resources/` (`icon.png` 1024², `splash.png`
  2732²); PWA icons in `icons/`.
- The web app is iOS-aware: full-bleed `viewport-fit=cover`, no pinch/zoom,
  safe-area insets around the panel, no rubber-band scroll, light status bar,
  and **PNG export routes through the native share sheet** (Save to Photos /
  Files) when running natively — falling back to a normal download in a browser.

## Prerequisites (on the Mac)

- macOS with **Xcode** (from the App Store) + Command Line Tools.
- **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`).
- **Node 18+** and this repo cloned.
- An Apple Developer account for signing.

## First build

```bash
npm install            # restores Capacitor + plugins
npm run ios:add        # builds www/ and runs `cap add ios` → creates ios/
npm run ios:open       # opens the project in Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → pick your Team
   (Xcode auto-manages the provisioning profile).
2. Pick a simulator or a plugged-in device and press **▶ Run**.

That's it — GeoMaker launches as a native app. Try **⬇ Save**: it opens the iOS
share sheet so you can *Save Image* to Photos or *Save to Files*.

## App icons & splash (optional but recommended)

The source art is in `resources/`. To generate the full icon/splash sets into
the iOS project, run on the Mac (needs the `sharp`-based generator, which
installs fine on macOS):

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --ios
```

## After changing the web app

Any time you edit the HTML/CSS/JS, re-sync the native project:

```bash
npm run sync           # = build:web + `cap sync ios`
```

(no need to re-run `ios:add`). Then Run again in Xcode.

## Submitting to the App Store

1. In Xcode set a real **Version** and **Build** number on the App target.
2. **Product → Archive**, then **Distribute App → App Store Connect**.
3. In [App Store Connect](https://appstoreconnect.apple.com): create the app
   record (bundle id `com.bayouwebstudio.geomaker`), add screenshots, description,
   privacy info (GeoMaker collects no data and makes no network calls — declare
   "Data Not Collected"), and submit for review.

## Notes & nice-to-haves

- **Orientation**: currently `any`. Lock it in Xcode (target → General → Device
  Orientation) if you prefer portrait-only.
- **Haptics**: `npm i @capacitor/haptics` and call `Haptics.impact()` on
  drag/tap in the interactive generators for a tactile feel (optional).
- **Android** is essentially free from here too: `npm i @capacitor/android &&
  npx cap add android` (needs Android Studio).
- The same `www/` build also works as a **PWA** (manifest + icons are in place),
  so "Add to Home Screen" in mobile Safari gives an installable app with no Xcode
  at all — a quick way to test on a phone before the App Store route.
