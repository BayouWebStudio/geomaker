// Assemble the static web app into www/, which is Capacitor's webDir (the
// folder copied into the native iOS app bundle). We have no bundler — this just
// copies the hand-authored assets, leaving node_modules/tests/etc. behind.
import fs from 'node:fs';

const OUT = 'www';
const ASSETS = ['index.html', 'css', 'js', 'manifest.webmanifest', 'icons'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const item of ASSETS) {
  if (fs.existsSync(item)) fs.cpSync(item, `${OUT}/${item}`, { recursive: true });
}
console.log(`build-web: copied ${ASSETS.filter((a) => fs.existsSync(a)).join(', ')} → ${OUT}/`);
