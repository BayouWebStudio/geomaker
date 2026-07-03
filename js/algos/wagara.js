// Wagara (和柄): traditional Japanese geometric patterns, each registered as
// its own generator (seigaiha, shippō, kikkō, kagome, yagasuri, uroko,
// ichimatsu) but sharing one parametric tiling engine. Asanoha lives in its
// own richer module (asanoha.js).

import { TAU, samplePalette, mixHex } from '../core/util.js';

function hexPath(ctx, x, y, size, flat) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

const P_SCALE = { key: 'scale', label: 'Scale', type: 'range', min: 16, max: 130, step: 2, value: 52 };
const P_LINE = { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.5, max: 8, step: 0.5, value: 2 };
const P_RINGS = { key: 'rings', label: 'Detail (rings)', type: 'range', min: 2, max: 8, step: 1, value: 4 };
const P_COLOR = {
  key: 'colorMode', label: 'Colors', type: 'select', value: 'two',
  options: [
    { value: 'two', label: 'two-tone (traditional)' },
    { value: 'gradient', label: 'gradient' },
    { value: 'mono', label: 'single ink' },
  ],
};

function createEngine(pattern, { ctx, width, height, palette, params }) {
  const P = params;
  const s = P.scale;
  const rings = Math.round(P.rings || 4);
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.hypot(cx, cy) || 1;
  const inkA = samplePalette(palette.colors, 0.82);
  const inkB = samplePalette(palette.colors, 0.3);
  const ink = samplePalette(palette.colors, 0.7);
  const grad = (x, y) => samplePalette(palette.colors, Math.hypot(x - cx, y - cy) / maxR);

  // ---- seigaiha: nested upper-semicircle crescents on an offset grid ----
  function seigaiha() {
    const R = s;
    const vy = R * 0.5;
    const hx = R;
    ctx.lineWidth = P.lineWidth;
    let row = 0;
    for (let y = -R; y < height + R; y += vy, row++) {
      const off = row % 2 ? hx / 2 : 0;
      for (let x = -R + off; x < width + R; x += hx) {
        for (let k = rings; k >= 1; k--) {
          const r = (R * k) / rings;
          ctx.beginPath();
          ctx.arc(x, y, r, Math.PI, TAU); // upper half
          if (P.colorMode === 'gradient') ctx.strokeStyle = grad(x, y);
          else ctx.strokeStyle = k % 2 ? inkA : inkB;
          ctx.stroke();
        }
      }
    }
  }

  // ---- shippō: circles on a square lattice, radius = d/√2, so each overlaps
  // its four orthogonal neighbours into the "seven treasures" flower ----
  function shippo() {
    const d = s;
    const r = d * Math.SQRT1_2;
    ctx.lineWidth = P.lineWidth;
    for (let y = -d; y < height + d; y += d) {
      for (let x = -d; x < width + d; x += d) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.strokeStyle = P.colorMode === 'gradient' ? grad(x, y) : ink;
        ctx.stroke();
      }
    }
  }

  // ---- kikkō: hexagonal tortoiseshell grid (+ a small inner hex) ----
  function kikko() {
    const size = s * 0.6;
    const dx = size * 1.5;
    const dy = size * Math.sqrt(3);
    ctx.lineWidth = P.lineWidth;
    ctx.lineJoin = 'round';
    for (let c = -1, cc = Math.ceil(width / dx) + 1; c <= cc; c++) {
      for (let r = -1, rr = Math.ceil(height / dy) + 1; r <= rr; r++) {
        const x = c * dx;
        const y = r * dy + (Math.abs(c) % 2 ? dy / 2 : 0);
        const color = P.colorMode === 'gradient' ? grad(x, y) : ink;
        hexPath(ctx, x, y, size, true);
        ctx.strokeStyle = color;
        ctx.stroke();
        if (rings > 3) {
          hexPath(ctx, x, y, size * 0.5, true);
          ctx.stroke();
        }
      }
    }
  }

  // ---- kagome: bamboo basket weave — three families of parallel lines at
  // 0°, 60° and 120° overlaid into the triaxial (trihexagonal) lattice ----
  function kagome() {
    ctx.lineWidth = P.lineWidth;
    const L = Math.hypot(width, height);
    const family = (deg, color) => {
      const a = (deg * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = -dy;
      const ny = dx;
      let lo = Infinity;
      let hi = -Infinity;
      for (const [px, py] of [[0, 0], [width, 0], [0, height], [width, height]]) {
        const o = px * nx + py * ny;
        lo = Math.min(lo, o);
        hi = Math.max(hi, o);
      }
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let o = Math.floor(lo / s) * s; o <= hi; o += s) {
        ctx.moveTo(o * nx - dx * L, o * ny - dy * L);
        ctx.lineTo(o * nx + dx * L, o * ny + dy * L);
      }
      ctx.stroke();
    };
    if (P.colorMode === 'mono') {
      family(0, ink);
      family(60, ink);
      family(120, ink);
    } else {
      family(0, samplePalette(palette.colors, 0.35));
      family(60, samplePalette(palette.colors, 0.6));
      family(120, samplePalette(palette.colors, 0.85));
    }
  }

  // ---- yagasuri: columns of arrow fletching (chevrons), two-tone ----
  function yagasuri() {
    const w = s;
    const fh = s * 0.7; // feather height
    for (let c = 0, col = 0; c < width + w; c += w, col++) {
      for (let y = -fh, rowi = 0; y < height + fh; y += fh, rowi++) {
        const up = (col + rowi) % 2 === 0;
        const color = P.colorMode === 'gradient' ? grad(c, y) : up ? inkA : inkB;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(c, y);
        ctx.lineTo(c + w / 2, y + fh * 0.4);
        ctx.lineTo(c + w, y);
        ctx.lineTo(c + w, y + fh);
        ctx.lineTo(c + w / 2, y + fh * 1.4);
        ctx.lineTo(c, y + fh);
        ctx.closePath();
        ctx.fill();
        if (P.lineWidth > 0) {
          ctx.lineWidth = P.lineWidth * 0.5;
          ctx.strokeStyle = mixHex(color, '#000000', 0.25);
          ctx.stroke();
        }
      }
    }
  }

  // ---- uroko: two-tone triangle scales ----
  function uroko() {
    const w = s;
    const h = s;
    for (let r = 0, row = 0; r < height + h; r += h, row++) {
      const off = row % 2 ? w / 2 : 0;
      for (let c = -w; c < width + w; c += w) {
        const x = c + off;
        // up triangle
        ctx.fillStyle = P.colorMode === 'gradient' ? grad(x, r) : inkA;
        ctx.beginPath();
        ctx.moveTo(x, r + h);
        ctx.lineTo(x + w / 2, r);
        ctx.lineTo(x + w, r + h);
        ctx.closePath();
        ctx.fill();
        // down triangle in the gap
        ctx.fillStyle = P.colorMode === 'gradient' ? grad(x + w / 2, r) : inkB;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, r);
        ctx.lineTo(x + w, r + h);
        ctx.lineTo(x + 1.5 * w, r);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // ---- ichimatsu: checkerboard ----
  function ichimatsu() {
    const a = s;
    for (let y = 0, row = 0; y < height; y += a, row++) {
      for (let x = 0, coli = 0; x < width; x += a, coli++) {
        if ((row + coli) % 2 === 0) {
          ctx.fillStyle = P.colorMode === 'gradient' ? grad(x + a / 2, y + a / 2) : inkA;
          ctx.fillRect(x, y, a + 0.5, a + 0.5);
        } else if (P.colorMode === 'two') {
          ctx.fillStyle = inkB;
          ctx.fillRect(x, y, a + 0.5, a + 0.5);
        }
      }
    }
  }

  const PATTERNS = { seigaiha, shippo, kikko, kagome, yagasuri, uroko, ichimatsu };

  let drawn = false;
  return {
    frame() {
      if (drawn) return false;
      drawn = true;
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      PATTERNS[pattern]();
      return false;
    },
  };
}

const variant = (pattern, name, description, params) => ({
  id: pattern,
  name,
  category: 'Geometric',
  description,
  params,
  create(env) {
    return createEngine(pattern, env);
  },
});

export const WAGARA_VARIANTS = [
  variant('seigaiha', 'Seigaiha (青海波)', 'Overlapping ocean-wave shells — nested crescents on an offset grid, the calm-seas blessing.', [P_SCALE, P_LINE, P_RINGS, P_COLOR]),
  variant('shippo', 'Shippō (七宝)', 'The "seven treasures": interlinked circles overlapping into four-petal flowers.', [P_SCALE, P_LINE, P_COLOR]),
  variant('kikko', 'Kikkō (亀甲)', 'Tortoiseshell hexagons — the longevity lattice, with an optional inner hex.', [P_SCALE, P_LINE, P_RINGS, P_COLOR]),
  variant('kagome', 'Kagome (籠目)', 'Bamboo basket weave: three line families crossing into the triaxial star lattice.', [P_SCALE, P_LINE, P_COLOR]),
  variant('yagasuri', 'Yagasuri (矢絣)', 'Arrow-feather fletching in striped columns — the pattern that never returns, like a loosed arrow.', [P_SCALE, P_LINE, P_COLOR]),
  variant('uroko', 'Uroko (鱗)', 'Scale triangles in alternating tones — the serpent-scale ward against misfortune.', [P_SCALE, P_COLOR]),
  variant('ichimatsu', 'Ichimatsu (市松)', 'The classic kabuki checkerboard, flat or gradient-shaded.', [P_SCALE, P_COLOR]),
];
