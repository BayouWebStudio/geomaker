# vesica.studio hand-off files

The live site is built from the **`BayouWebStudio/vesica-landing`** repo
(private, React/Vite). This session only has access to the geomaker repo, so
these two files are staged here, ready to drop in:

## 1. `geomaker-privacy.html` — the App Store privacy URL

Copy it into vesica-landing's **`public/`** folder (files there are served
as-is at the site root) and deploy. It then lives at:

    https://vesica.studio/geomaker-privacy.html

That URL is already referenced by the GeoMaker app's About panel and by
APPSTORE.md as the Privacy Policy URL for App Store Connect — **deploy it
before submitting the app** (the pre-submit checklist has a box for this).

## 2. `family-section.html` — "The Vesica Family" section

A self-contained section (inline styles, uses the site's existing Google
Fonts) presenting both apps as a family. Paste it into the landing page —
either directly if any part is plain HTML, or in React via:

```jsx
import family from './family-section.html?raw';
<div dangerouslySetInnerHTML={{ __html: family }} />
```

…or just recreate it as a component; all the copy and colors are in the file.

⚠️ Replace `GEOMAKER_APPSTORE_URL` with the real store link once
"GeoMaker – Pattern Studio" is approved and live.

## Fastest path

Open a Claude session scoped to `BayouWebStudio/vesica-landing` and say:
"Add the two files from geomaker's `site/vesica.studio/` — the privacy page
into public/, and the family section onto the landing page."
