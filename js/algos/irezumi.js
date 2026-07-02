// Irezumi Waves & Clouds: the classic Japanese tattoo backgrounds — nami
// (waves with spiral curls and foam fingers), kumo (scallop-edged clouds with
// concentric echo lines) and kasumi (stepped mist bars). Tap the canvas to
// stamp another crest / cloud / mist band where you want it.

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'irezumi',
  name: 'Irezumi Waves & Clouds',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'tap to stamp another wave crest, cloud or mist band',
  description: 'Japanese tattoo backgrounds: spiral-crested waves with foam fingers, echoed clouds, stepped mist.',
  params: [
    {
      key: 'style', label: 'Element', type: 'select', value: 'nami',
      options: [
        { value: 'nami', label: 'nami — waves' },
        { value: 'kumo', label: 'kumo — clouds' },
        { value: 'kasumi', label: 'kasumi — mist' },
      ],
    },
    { key: 'size', label: 'Element size', type: 'range', min: 40, max: 200, step: 5, value: 110 },
    { key: 'density', label: 'Base density', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 8, step: 0.5, value: 2.5 },
    { key: 'echo', label: 'Echo lines', type: 'range', min: 0, max: 3, step: 1, value: 2 },
    { key: 'fingers', label: 'Foam fingers', type: 'range', min: 0, max: 7, step: 1, value: 5 },
    { key: 'tone', label: 'Fill tone', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const ink = samplePalette(palette.colors, 0.12);
    const fillLight = mixHex(samplePalette(palette.colors, 0.9), palette.bg, 1 - P.tone);

    // base composition (seeded) + user-stamped elements (taps)
    const els = [];
    if (P.style === 'nami') {
      const rows = 2 + Math.round(P.density * 3);
      for (let r = 0; r < rows; r++) {
        const y = height * (0.25 + (r / rows) * 0.75);
        const n = 2 + Math.round(P.density * 2);
        for (let i = 0; i < n; i++) {
          els.push({
            x: width * ((i + (r % 2 ? 0.5 : 0.15)) / n) + rng.range(-20, 20),
            y: y + rng.range(-14, 14),
            s: P.size * rng.range(0.7, 1.15) * (0.75 + (r / rows) * 0.4),
            flip: rng.random() < 0.18 ? -1 : 1,
          });
        }
      }
    } else {
      const n = 3 + Math.round(P.density * 6);
      for (let i = 0; i < n; i++) {
        els.push({
          x: rng.range(width * 0.08, width * 0.92),
          y: rng.range(height * 0.08, height * 0.92),
          s: P.size * rng.range(0.6, 1.2),
          flip: rng.random() < 0.5 ? -1 : 1,
        });
      }
    }
    // paint back-to-front so nearer elements overlap farther ones
    els.sort((a, b) => a.y - b.y);

    function crest(x, y, s, flip) {
      const dir = flip;
      // body: a swelling hump that curls over at the front
      ctx.beginPath();
      ctx.moveTo(x - 1.7 * s * dir, y + 0.55 * s);
      ctx.bezierCurveTo(x - 1.25 * s * dir, y - 0.1 * s, x - 0.7 * s * dir, y - 0.62 * s, x + 0.05 * s * dir, y - 0.55 * s);
      ctx.bezierCurveTo(x + 0.55 * s * dir, y - 0.5 * s, x + 0.75 * s * dir, y - 0.15 * s, x + 0.62 * s * dir, y + 0.12 * s);
      ctx.lineTo(x + 0.85 * s * dir, y + 0.55 * s);
      ctx.closePath();
      ctx.fillStyle = fillLight;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      // the curl: a logarithmic spiral tucked into the crest front
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= TAU * 2.1; t += 0.12) {
        const r = 0.42 * s * Math.exp(-0.28 * t);
        const px = x + 0.28 * s * dir + Math.cos(t * -dir + Math.PI) * r * dir;
        const py = y - 0.12 * s + Math.sin(t * -dir + Math.PI) * r;
        first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        first = false;
      }
      ctx.stroke();
      // foam fingers fanning forward off the crest lip
      for (let f = 0; f < P.fingers; f++) {
        const t = f / Math.max(1, P.fingers - 1);
        const fr = s * (0.5 + t * 0.45);
        const start = -0.5 - t * 0.55; // radians above the horizon
        const sweep = 0.5 - t * 0.16;
        ctx.beginPath();
        if (dir > 0) ctx.arc(x + 0.24 * s, y + 0.04 * s, fr, start, start + sweep);
        else ctx.arc(x - 0.24 * s, y + 0.04 * s, fr, Math.PI - start - sweep, Math.PI - start);
        ctx.lineWidth = P.lineWidth * (1 - t * 0.45);
        ctx.stroke();
      }
      // inner echo lines follow the belly of the wave
      for (let e = 1; e <= P.echo; e++) {
        const k = e / (P.echo + 1);
        ctx.beginPath();
        ctx.moveTo(x - (1.7 - k * 0.9) * s * dir, y + 0.55 * s);
        ctx.bezierCurveTo(
          x - (1.2 - k * 0.7) * s * dir, y + (0.05 - k * 0.32) * s,
          x - (0.55 - k * 0.3) * s * dir, y + (-0.28 + k * 0.1) * s,
          x + 0.15 * s * dir, y + (-0.2 + k * 0.28) * s
        );
        ctx.lineWidth = P.lineWidth * 0.7;
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
          const wob = 1 + 0.12 * Math.sin(i * 2.7 + flip);
          const px = x + Math.cos(a) * rx * 0.9 * wob * scale;
          const py = y + Math.sin(a) * s * 0.52 * wob * scale;
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
      for (let e = 1; e <= P.echo; e++) {
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
        ctx.beginPath();
        const r = h / 2;
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

    let dirty = true;
    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const el of els) {
        if (P.style === 'nami') crest(el.x, el.y, el.s, el.flip);
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
        els.push({ x, y, s: P.size * rng.range(0.75, 1.15), flip: rng.random() < 0.2 ? -1 : 1 });
        if (els.length > 60) els.shift();
        els.sort((a, b) => a.y - b.y);
        dirty = true;
      },
    };
  },
};
