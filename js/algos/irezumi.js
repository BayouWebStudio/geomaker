// Irezumi Waves & Clouds: the classic Japanese tattoo backgrounds. Nami is
// built the way irezumi actually works — overlapping ranks of wave swells
// that fill the whole field, each with parallel flow lines (sujibori water
// lines), a spiral curl and claw-like foam fingers, all breaking the same
// way. Kumo are scallop-edged clouds with echo lines; kasumi is stepped mist.
// Tap the canvas to stamp another element in front.

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'irezumi',
  name: 'Irezumi Waves & Clouds',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'tap to stamp another wave crest, cloud or mist band',
  description: 'Japanese tattoo backgrounds: ranked wave swells with flow lines, spiral curls and foam fingers; echoed clouds; stepped mist.',
  params: [
    {
      key: 'style', label: 'Element', type: 'select', value: 'nami',
      options: [
        { value: 'nami', label: 'nami — waves' },
        { value: 'kumo', label: 'kumo — clouds' },
        { value: 'kasumi', label: 'kasumi — mist' },
      ],
    },
    { key: 'size', label: 'Element size', type: 'range', min: 40, max: 200, step: 5, value: 100 },
    { key: 'density', label: 'Rank overlap', type: 'range', min: 0, max: 1, step: 0.05, value: 0.6 },
    {
      key: 'direction', label: 'Break direction', type: 'select', value: 'right',
      options: [
        { value: 'right', label: 'breaking right' },
        { value: 'left', label: 'breaking left' },
        { value: 'alternate', label: 'alternate ranks' },
      ],
    },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 8, step: 0.5, value: 2.5 },
    { key: 'echo', label: 'Flow lines', type: 'range', min: 0, max: 6, step: 1, value: 3 },
    { key: 'fingers', label: 'Foam fingers', type: 'range', min: 0, max: 7, step: 1, value: 4 },
    { key: 'tone', label: 'Fill tone', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const ink = samplePalette(palette.colors, 0.12);
    const fillLight = mixHex(samplePalette(palette.colors, 0.9), palette.bg, 1 - P.tone);
    const fillMid = mixHex(fillLight, ink, 0.08);

    // user-stamped extras (taps), drawn in front of the ranked field
    const stamped = [];

    function wob(x, y, k) {
      return noise.noise3(x * 0.006, y * 0.006, k) * P.size * 0.05;
    }

    // one wave swell: silhouette (filled + bold stroke), inner flow lines,
    // spiral curl at the break, foam fingers reaching along the break
    function swell(x, y, s, dir, front) {
      const d = dir;
      const left = x - 1.05 * s * d;
      const base = y + 0.02 * s;
      // silhouette control points: long back slope up to the crest, short
      // curl-over at the front — classic swelling mound
      const peakX = x + 0.12 * s * d;
      const peakY = y - 0.5 * s + wob(x, y, 3);
      const tipX = x + 0.46 * s * d;
      const tipY = y - 0.2 * s;

      const silhouette = (k) => {
        // k in [0,1]: 1 = full silhouette, smaller = inner flow line
        const lx = x - (1.05 - 0.78 * (1 - k)) * s * d;
        const py = y - (0.5 * k) * s + wob(x + k * 40, y, 3);
        const px = x + 0.12 * s * k * d;
        const tx = x + (0.46 - 0.1 * (1 - k)) * s * k * d;
        const ty = y - 0.2 * s * k;
        ctx.moveTo(lx, base);
        ctx.bezierCurveTo(
          lx + 0.45 * s * k * d, base - 0.42 * s * k,
          px - 0.38 * s * k * d, py,
          px, py
        );
        ctx.bezierCurveTo(
          px + 0.3 * s * k * d, py + 0.02 * s,
          tx + 0.08 * s * k * d, ty - 0.14 * s * k,
          tx, ty
        );
      };

      // filled body covers the rank behind it
      ctx.beginPath();
      silhouette(1);
      ctx.lineTo(tipX, base);
      ctx.closePath();
      ctx.fillStyle = front ? fillMid : fillLight;
      ctx.fill();

      // bold sujibori outline
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      silhouette(1);
      ctx.stroke();

      // parallel flow lines riding the swell
      const flows = Math.round(P.echo);
      ctx.lineWidth = Math.max(0.6, P.lineWidth * 0.55);
      for (let e = 1; e <= flows; e++) {
        const k = 1 - e / (flows + 1.2);
        ctx.beginPath();
        silhouette(k);
        ctx.stroke();
      }

      // the curl: logarithmic spiral tucked into the break
      const cxs = x + 0.34 * s * d;
      const cys = y - 0.27 * s;
      ctx.lineWidth = P.lineWidth * 0.85;
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= TAU * 1.9; t += 0.14) {
        const r = 0.17 * s * Math.exp(-0.3 * t);
        const px = cxs + Math.cos(Math.PI - t * d) * r * d;
        const py = cys + Math.sin(Math.PI - t * d) * r;
        first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        first = false;
      }
      ctx.stroke();

      // claw-like foam fingers sweeping forward off the break
      for (let f = 0; f < P.fingers; f++) {
        const t = P.fingers > 1 ? f / (P.fingers - 1) : 0;
        const fr = s * (0.2 + t * 0.26);
        const a0 = -1.25 + t * 0.5;
        const sweep = 1.05 - t * 0.3;
        ctx.lineWidth = Math.max(0.6, P.lineWidth * (0.9 - t * 0.4));
        ctx.beginPath();
        if (d > 0) ctx.arc(cxs, cys + 0.04 * s, fr, a0, a0 + sweep);
        else ctx.arc(cxs, cys + 0.04 * s, fr, Math.PI - a0 - sweep, Math.PI - a0);
        ctx.stroke();
      }
    }

    function cloud(x, y, s, flip) {
      const rx = 1.55 * s;
      const scallops = 9;
      const path = (scale) => {
        ctx.beginPath();
        for (let i = 0; i <= scallops; i++) {
          const a = (i / scallops) * TAU;
          const a2 = ((i + 0.5) / scallops) * TAU;
          const wobble = 1 + 0.12 * Math.sin(i * 2.7 + flip);
          const px = x + Math.cos(a) * rx * 0.9 * wobble * scale;
          const py = y + Math.sin(a) * s * 0.52 * wobble * scale;
          const cxp = x + Math.cos(a2) * rx * 1.35 * scale;
          const cyp = y + Math.sin(a2) * s * 0.85 * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.quadraticCurveTo(cxp, cyp, px, py);
        }
        ctx.closePath();
      };
      path(1);
      ctx.fillStyle = fillLight;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.stroke();
      for (let e = 1; e <= Math.min(3, P.echo); e++) {
        path(1 - e * 0.22);
        ctx.lineWidth = P.lineWidth * 0.6;
        ctx.stroke();
      }
    }

    function mist(x, y, s, flip) {
      const bars = 2 + (P.echo > 0 ? 1 : 0) + (P.echo > 2 ? 1 : 0);
      const h = s * 0.16;
      for (let b = 0; b < bars; b++) {
        const w = s * (1.6 - b * 0.35) * (0.8 + 0.4 * Math.abs(Math.sin(b * 2 + flip)));
        const ox = x + flip * b * s * 0.34;
        const oy = y + b * h * 1.7;
        const r = h / 2;
        ctx.beginPath();
        ctx.moveTo(ox - w / 2 + r, oy - r);
        ctx.arcTo(ox + w / 2, oy - r, ox + w / 2, oy + r, r);
        ctx.arcTo(ox + w / 2, oy + r, ox - w / 2, oy + r, r);
        ctx.arcTo(ox - w / 2, oy + r, ox - w / 2, oy - r, r);
        ctx.arcTo(ox - w / 2, oy - r, ox + w / 2, oy - r, r);
        ctx.closePath();
        ctx.fillStyle = fillLight;
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth;
        ctx.stroke();
      }
    }

    function rankDir(row) {
      if (P.direction === 'left') return -1;
      if (P.direction === 'alternate') return row % 2 === 0 ? 1 : -1;
      return 1;
    }

    function drawNamiField() {
      // overlapping ranks, top first so lower ranks break in front
      const W = P.size * 1.7;
      const H = W * (0.42 - P.density * 0.18);
      const rows = Math.ceil(height / H) + 3;
      const cols = Math.ceil(width / W) + 3;
      for (let r = -1; r < rows; r++) {
        const y = r * H;
        const d = rankDir(r);
        const off = (r % 2 ? W / 2 : 0) + noise.noise3(0.3, r * 0.7, 9) * W * 0.18;
        for (let c = -2; c < cols; c++) {
          const x = c * W + off;
          const s = W * (0.94 + noise.noise3(c * 0.8, r * 0.8, 5) * 0.16);
          swell(x, y, s, d, false);
        }
      }
    }

    function drawScatterField(fn) {
      const n = 3 + Math.round(P.density * 6);
      const els = [];
      for (let i = 0; i < n; i++) {
        els.push({
          x: rng.range(width * 0.08, width * 0.92),
          y: rng.range(height * 0.08, height * 0.92),
          s: P.size * rng.range(0.6, 1.2),
          flip: rng.random() < 0.5 ? -1 : 1,
        });
      }
      els.sort((a, b) => a.y - b.y);
      for (const el of els) fn(el.x, el.y, el.s, el.flip);
    }

    let dirty = true;
    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      if (P.style === 'nami') drawNamiField();
      else if (P.style === 'kumo') drawScatterField(cloud);
      else drawScatterField(mist);
      for (const el of stamped) {
        if (P.style === 'nami') swell(el.x, el.y, el.s, el.flip, true);
        else if (P.style === 'kumo') cloud(el.x, el.y, el.s, el.flip);
        else mist(el.x, el.y, el.s, el.flip);
      }
    }

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for taps
      },
      onDown(x, y) {
        stamped.push({
          x,
          y,
          s: P.size * rng.range(1, 1.5),
          flip: P.direction === 'left' ? -1 : 1,
        });
        if (stamped.length > 40) stamped.shift();
        dirty = true;
      },
    };
  },
};
