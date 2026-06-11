// GeoMaker app shell: canvas lifecycle, render loop, state, sharing, export.

import { createRng, randomSeedString } from './core/rng.js';
import { createNoise } from './core/noise.js';
import { PALETTES, getPalette } from './core/palettes.js';
import { ALGORITHMS, algoById } from './algos/index.js';
import { buildControls } from './ui.js';

const STORAGE_KEY = 'geomaker-state-v1';

const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');

const els = {
  panel: document.getElementById('panel'),
  showUi: document.getElementById('show-ui'),
  hideUi: document.getElementById('hide-ui'),
  algo: document.getElementById('algo-select'),
  algoDesc: document.getElementById('algo-desc'),
  seed: document.getElementById('seed-input'),
  dice: document.getElementById('seed-dice'),
  palette: document.getElementById('palette-select'),
  swatches: document.getElementById('swatches'),
  params: document.getElementById('param-controls'),
  shuffle: document.getElementById('btn-shuffle'),
  regen: document.getElementById('btn-regen'),
  play: document.getElementById('btn-play'),
  save: document.getElementById('btn-save'),
  link: document.getElementById('btn-link'),
  toast: document.getElementById('toast'),
};

const state = {
  algoId: ALGORITHMS[0].id,
  seed: randomSeedString(),
  paletteName: PALETTES[0].name,
  params: {}, // per-algorithm overrides: { algoId: { key: value } }
};

let instance = null;
let playing = false;
let finished = false;

function schemaDefaults(algo) {
  const out = {};
  for (const def of algo.params) out[def.key] = def.value;
  return out;
}

function currentParams(algo) {
  return { ...schemaDefaults(algo), ...(state.params[algo.id] || {}) };
}

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

function setPlayButton() {
  els.play.textContent = finished ? '↺' : playing ? '⏸' : '▶';
  els.play.title = finished ? 'Replay (P)' : playing ? 'Pause (P)' : 'Resume (P)';
}

function regenerate() {
  const algo = algoById(state.algoId);
  const { w, h } = fitCanvas();
  const palette = getPalette(state.paletteName);
  // namespace the seed per algorithm so switching algos gives fresh compositions
  const rng = createRng(`${state.seed}::${algo.id}`);
  const noise = createNoise(rng);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  instance = algo.create({ ctx, width: w, height: h, rng, noise, palette, params: currentParams(algo) });
  finished = false;
  playing = true;
  setPlayButton();
  updateHash();
  persist();
}

function tick() {
  requestAnimationFrame(tick);
  if (playing && instance && !finished) {
    if (instance.frame() === false) {
      finished = true;
      playing = false;
      setPlayButton();
    }
  }
}

// ---- state <-> url hash / localStorage ----

function updateHash() {
  const algo = algoById(state.algoId);
  const qs = new URLSearchParams();
  qs.set('a', state.algoId);
  qs.set('s', state.seed);
  qs.set('p', state.paletteName);
  const params = currentParams(algo);
  for (const [k, v] of Object.entries(params)) qs.set('p_' + k, String(v));
  history.replaceState(null, '', '#' + qs.toString());
}

function coerce(def, raw) {
  if (def.type === 'checkbox') return raw === 'true' || raw === '1';
  if (def.type === 'select') {
    return def.options.some((o) => String(o.value) === raw) ? raw : def.value;
  }
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return def.value;
  return Math.min(def.max, Math.max(def.min, v));
}

function applySnapshot(snap) {
  if (!snap) return;
  if (snap.algoId && ALGORITHMS.some((a) => a.id === snap.algoId)) state.algoId = snap.algoId;
  if (snap.seed) state.seed = String(snap.seed);
  if (snap.paletteName && PALETTES.some((p) => p.name === snap.paletteName)) {
    state.paletteName = snap.paletteName;
  }
  if (snap.params && typeof snap.params === 'object') {
    for (const algo of ALGORITHMS) {
      const incoming = snap.params[algo.id];
      if (!incoming) continue;
      const clean = {};
      for (const def of algo.params) {
        if (incoming[def.key] !== undefined) clean[def.key] = coerce(def, String(incoming[def.key]));
      }
      state.params[algo.id] = clean;
    }
  }
}

function loadFromHash() {
  if (!location.hash || location.hash.length < 2) return false;
  const qs = new URLSearchParams(location.hash.slice(1));
  const algoId = qs.get('a');
  if (!algoId || !ALGORITHMS.some((a) => a.id === algoId)) return false;
  const algo = algoById(algoId);
  const params = {};
  for (const def of algo.params) {
    const raw = qs.get('p_' + def.key);
    if (raw !== null) params[def.key] = raw;
  }
  applySnapshot({
    algoId,
    seed: qs.get('s') || state.seed,
    paletteName: qs.get('p') || state.paletteName,
    params: { [algoId]: params },
  });
  return true;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode etc. — persistence is optional */
  }
}

function restore() {
  try {
    applySnapshot(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    /* ignore corrupt state */
  }
}

// ---- ui wiring ----

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.classList.remove('show');
    toast.timer = setTimeout(() => (els.toast.hidden = true), 300);
  }, 1800);
}

function renderSwatches() {
  const palette = getPalette(state.paletteName);
  els.swatches.textContent = '';
  const chips = [palette.bg, ...palette.colors];
  for (const c of chips) {
    const chip = document.createElement('span');
    chip.className = 'swatch';
    chip.style.background = c;
    chip.title = c;
    els.swatches.append(chip);
  }
}

let regenTimer = 0;
function debounceRegen() {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(regenerate, 160);
}

function rebuildParamControls() {
  const algo = algoById(state.algoId);
  els.algoDesc.textContent = algo.description;
  if (!state.params[algo.id]) state.params[algo.id] = {};
  buildControls(els.params, algo.params, currentParams(algo), (key, value) => {
    state.params[algo.id][key] = value;
    debounceRegen();
  });
}

function newSeed() {
  state.seed = randomSeedString();
  els.seed.value = state.seed;
  regenerate();
}

function surprise() {
  state.seed = randomSeedString();
  state.paletteName = PALETTES[Math.floor(Math.random() * PALETTES.length)].name;
  els.seed.value = state.seed;
  els.palette.value = state.paletteName;
  renderSwatches();
  regenerate();
}

function savePng() {
  const algo = algoById(state.algoId);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safeSeed = state.seed.replace(/[^a-z0-9_-]+/gi, '-');
    a.download = `geomaker-${algo.id}-${safeSeed}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  toast('PNG saved');
}

async function copyLink() {
  updateHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied — same seed, same art');
  } catch {
    // clipboard API needs a secure context; fall back to a visible prompt
    window.prompt('Copy this link:', url);
  }
}

function togglePanel(show) {
  const showing = show ?? els.panel.hidden;
  els.panel.hidden = !showing;
  els.showUi.hidden = showing;
}

function init() {
  restore();
  loadFromHash();

  for (const algo of ALGORITHMS) {
    const o = document.createElement('option');
    o.value = algo.id;
    o.textContent = algo.name;
    els.algo.append(o);
  }
  for (const p of PALETTES) {
    const o = document.createElement('option');
    o.value = p.name;
    o.textContent = p.name;
    els.palette.append(o);
  }
  els.algo.value = state.algoId;
  els.palette.value = state.paletteName;
  els.seed.value = state.seed;
  renderSwatches();
  rebuildParamControls();

  els.algo.addEventListener('change', () => {
    state.algoId = els.algo.value;
    rebuildParamControls();
    regenerate();
  });
  els.palette.addEventListener('change', () => {
    state.paletteName = els.palette.value;
    renderSwatches();
    regenerate();
  });
  const commitSeed = () => {
    const v = els.seed.value.trim();
    if (v && v !== state.seed) {
      state.seed = v;
      regenerate();
    }
  };
  els.seed.addEventListener('change', commitSeed);
  els.seed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      commitSeed();
      els.seed.blur();
    }
  });
  els.dice.addEventListener('click', newSeed);
  els.shuffle.addEventListener('click', surprise);
  els.regen.addEventListener('click', regenerate);
  els.play.addEventListener('click', () => {
    if (finished) {
      regenerate();
    } else {
      playing = !playing;
      setPlayButton();
    }
  });
  els.save.addEventListener('click', savePng);
  els.link.addEventListener('click', copyLink);
  els.hideUi.addEventListener('click', () => togglePanel(false));
  els.showUi.addEventListener('click', () => togglePanel(true));

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') {
      e.preventDefault();
      surprise();
    } else if (e.key === 'r') regenerate();
    else if (e.key === 'p') els.play.click();
    else if (e.key === 's') savePng();
    else if (e.key === 'c') copyLink();
    else if (e.key === 'h') togglePanel();
  });

  let resizeTimer = 0;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        regenerate();
      }
    }, 250);
  });

  regenerate();
  requestAnimationFrame(tick);
}

init();
