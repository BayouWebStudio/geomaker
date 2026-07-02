// Assemble the static web app into www/, which is Capacitor's webDir (the
// folder copied into the native iOS app bundle). We have no bundler — this just
// copies the hand-authored assets, leaving node_modules/tests/etc. behind.
//
// The copied index.html gets ?v=<version> stamped onto its css/js entry URLs:
// WKWebView caches aggressively across dev rebuilds, and a stale main.js
// against a fresh index.html crashes on boot (black screen). Bump the version
// in package.json when shipping.
import fs from 'node:fs';

const OUT = 'www';
const ASSETS = ['index.html', 'css', 'js', 'manifest.webmanifest', 'icons'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const item of ASSETS) {
  if (fs.existsSync(item)) fs.cpSync(item, `${OUT}/${item}`, { recursive: true });
}

const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const indexPath = `${OUT}/index.html`;
const html = fs.readFileSync(indexPath, 'utf8')
  .replace('href="css/style.css"', `href="css/style.css?v=${version}"`)
  .replace('src="js/main.js"', `src="js/main.js?v=${version}"`);
fs.writeFileSync(indexPath, html);

console.log(`build-web: copied ${ASSETS.filter((a) => fs.existsSync(a)).join(', ')} → ${OUT}/ (assets stamped v${version})`);
