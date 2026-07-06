// Wagara III (和柄): a third family of classical Japanese patterns, all clean
// connected linework — kōji-tsunagi (interlocking 工 glyphs), shokkō (the
// octagon-and-square brocade of Shu silks), fundō-tsunagi (chained scale
// weights), wachigai (interlaced rings), same-komon (shark-skin dot arcs)
// and amime (the fishing-net mesh).

import { TAU, samplePalette, mixHex, withAlpha } from '../core/util.js';

const P_SIZE = { key: 'size', label: 'Scale', type: 'range', min: 14, max: 90, step: 2, value: 42 };
const P_LINE = { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 10, step: 0.5, value: 2.5 };
const P_CONTRAST = { key: 'contrast', label: 'Fill contrast', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 };
const P_COLOR = {
  key: 'colorMode', label: 'Color by', type: 'select', value: 'twotone',
  options: [
    { value: 'twotone', label: 'two-tone' },
    { value: 'gradient', label: 'gradient' },
    { value: 'ink', label: 'line only' },
  ],
};

function createEngine(style, { ctx, width, height, palette, params }) {
  const P = params;
  const D = Math.hypot(width, height);
  const ink = samplePalette(palette.colors, 0.15);

  function tone(t) {
    if (P.colorMode === 'ink') return null;
    const base = P.colorMode === 'gradient'
      ? samplePalette(palette.colors, t)
      : (t < 0.5 ? samplePalette(palette.colors, 0.75) : samplePalette(palette.colors, 0.95));
    return mixHex(base, palette.bg, 1 - P.contrast);
  }

  // ---- kōji-tsunagi: interlocking 工 glyphs. Every cell holds one glyph,
  // orientation checkerboarded; at link=1 the bar tips meet at the cell
  // corners and the whole lattice becomes one connected fret ----
  function drawKoji() {
    const s = P.size;
    const g = s * 0.5 * P.link; // bar half-span
    const colsN = Math.ceil(D / s) + 2;
    ctx.strokeStyle = ink;
    ctx.lineWidth = P.lineWidth;
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (let j = -1; j < colsN; j++) {
      for (let i = -1; i < colsN; i++) {
        const cx = i * s + s / 2;
        const cy = j * s + s / 2;
        if ((i + j) % 2 === 0) {
          // vertical 工: bars across the top and bottom, stem down the middle
          ctx.moveTo(cx - g, cy - g);
          ctx.lineTo(cx + g, cy - g);
          ctx.moveTo(cx - g, cy + g);
          ctx.lineTo(cx + g, cy + g);
          ctx.moveTo(cx, cy - g);
          ctx.lineTo(cx, cy + g);
        } else {
          ctx.moveTo(cx - g, cy - g);
          ctx.lineTo(cx - g, cy + g);
          ctx.moveTo(cx + g, cy - g);
          ctx.lineTo(cx + g, cy + g);
          ctx.moveTo(cx - g, cy);
          ctx.lineTo(cx + g, cy);
        }
      }
    }
    ctx.stroke();
  }

  // ---- shokkō: truncated-square brocade — regular octagons on a square
  // lattice, 45° squares in the gaps, flower-diamond hearts inside ----
  function drawShokko() {
    const W = P.size * 1.9; // octagon width across flats = lattice pitch
    const a = W / (1 + Math.SQRT2); // octagon side
    const colsN = Math.ceil(D / W) + 2;
    ctx.lineJoin = 'round';

    const octagon = (cx, cy, w) => {
      const h = w / 2;
      const c = (w / (1 + Math.SQRT2)) / 2; // half side
      ctx.moveTo(cx - c, cy - h);
      ctx.lineTo(cx + c, cy - h);
      ctx.lineTo(cx + h, cy - c);
      ctx.lineTo(cx + h, cy + c);
      ctx.lineTo(cx + c, cy + h);
      ctx.lineTo(cx - c, cy + h);
      ctx.lineTo(cx - h, cy + c);
      ctx.lineTo(cx - h, cy - c);
      ctx.closePath();
    };

    for (let j = -1; j < colsN; j++) {
      for (let i = -1; i < colsN; i++) {
        const cx = i * W + W / 2;
        const cy = j * W + W / 2;
        const fill = tone(P.colorMode === 'gradient' ? ((i + j + 20) % 9) / 9 : (i + j) % 2 === 0 ? 0.25 : 0.75);
        ctx.beginPath();
        octagon(cx, cy, W * 0.98);
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth;
        ctx.stroke();
        // double inner wall
        ctx.beginPath();
        octagon(cx, cy, W * 0.8);
        ctx.lineWidth = Math.max(0.6, P.lineWidth * 0.5);
        ctx.stroke();
        // heart: alternate eight-petal flower and four-diamond cross
        const r = W * 0.26;
        ctx.beginPath();
        if ((i + j) % 2 === 0) {
          for (let k = 0; k < 8; k++) {
            const ang = (k / 8) * TAU;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(
              cx + Math.cos(ang - 0.42) * r * 0.85, cy + Math.sin(ang - 0.42) * r * 0.85,
              px, py,
            );
            ctx.quadraticCurveTo(
              cx + Math.cos(ang + 0.42) * r * 0.85, cy + Math.sin(ang + 0.42) * r * 0.85,
              cx, cy,
            );
          }
        } else {
          for (let k = 0; k < 4; k++) {
            const ang = (k / 4) * TAU + Math.PI / 4;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            const s1 = ang - Math.PI / 4;
            const s2 = ang + Math.PI / 4;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(s1) * r * 0.55, cy + Math.sin(s1) * r * 0.55);
            ctx.lineTo(px, py);
            ctx.lineTo(cx + Math.cos(s2) * r * 0.55, cy + Math.sin(s2) * r * 0.55);
            ctx.closePath();
          }
        }
        ctx.lineWidth = Math.max(0.6, P.lineWidth * 0.5);
        ctx.stroke();
        // the 45° square between four octagons, with a diamond eye
        const sx = i * W;
        const sy = j * W;
        const hs = a / 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy - hs * Math.SQRT2 * 0.98);
        ctx.lineTo(sx + hs * Math.SQRT2 * 0.98, sy);
        ctx.lineTo(sx, sy + hs * Math.SQRT2 * 0.98);
        ctx.lineTo(sx - hs * Math.SQRT2 * 0.98, sy);
        ctx.closePath();
        const sq = tone(0.5);
        if (sq) {
          ctx.fillStyle = sq;
          ctx.fill();
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1, a * 0.12), 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
      }
    }
  }

  // ---- fundō-tsunagi: scale-weight chains — concave diamonds whose tips
  // touch on a square lattice, round voids blooming between them ----
  function drawFundo() {
    const r = P.size * 0.7; // tip radius: lattice pitch is 2r
    const pitch = r * 2;
    const colsN = Math.ceil(D / pitch) + 2;
    const bow = 1.6; // arc centers sit at (±br, ±br) → gently concave sides
    const cR = Math.hypot(bow * r - r, bow * r); // arc radius through both tips
    ctx.lineJoin = 'round';
    for (let j = -1; j < colsN; j++) {
      for (let i = -1; i < colsN; i++) {
        const cx = i * pitch;
        const cy = j * pitch;
        const t = P.colorMode === 'gradient' ? ((i + j + 20) % 8) / 8 : (i + j) % 2 === 0 ? 0.25 : 0.75;
        const fill = tone(t);
        ctx.beginPath();
        // four concave arcs tip → tip, arc centers out on the diagonals
        ctx.moveTo(cx + r, cy);
        for (const [ax, ay] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
          const ccx = cx + ax * bow * r;
          const ccy = cy + ay * bow * r;
          const tip1 = ax * ay > 0 ? [cx + ax * r, cy] : [cx, cy + ay * r];
          const tip2 = ax * ay > 0 ? [cx, cy + ay * r] : [cx + ax * r, cy];
          const ang1 = Math.atan2(tip1[1] - ccy, tip1[0] - ccx);
          const ang2 = Math.atan2(tip2[1] - ccy, tip2[0] - ccx);
          ctx.arc(ccx, ccy, cR, ang1, ang2, true);
        }
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth;
        ctx.stroke();
      }
    }
  }

  // ---- wachigai: interlaced rings — every ring overlaps its four
  // neighbours and weaves over-under like chain mail ----
  function drawWachigai() {
    const R = P.size * 0.85; // outer ring radius
    const g = R * 1.72; // grid pitch → a modest overlap lens
    const band = R * 0.15; // annulus thickness (double outline)
    const Ri = R - band;
    const colsN = Math.ceil(D / g) + 2;
    const alpha = Math.acos(g / (2 * R)) + 0.1; // lens half-angle + padding
    ctx.lineCap = 'round';

    const ring = (cx, cy, a0, a1) => {
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1);
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, Ri, a0, a1);
      ctx.stroke();
    };

    // pass 1: full rings
    for (let j = -1; j < colsN; j++) {
      for (let i = -1; i < colsN; i++) {
        const fill = tone(P.colorMode === 'gradient' ? ((i + j + 20) % 8) / 8 : 0.3);
        if (fill) {
          ctx.beginPath();
          ctx.arc(i * g, j * g, (R + Ri) / 2, 0, TAU);
          ctx.strokeStyle = withAlpha(fill, 0.9);
          ctx.lineWidth = band;
          ctx.stroke();
        }
        ring(i * g, j * g, 0, TAU);
      }
    }
    // pass 2: weave — at each crossing exactly one ring goes over; repaint
    // its arc with a background halo so it reads as passing on top
    for (let j = -1; j < colsN; j++) {
      for (let i = -1; i < colsN; i++) {
        const cx = i * g;
        const cy = j * g;
        for (const [dir, horizontal] of [[0, true], [Math.PI, true], [Math.PI / 2, false], [-Math.PI / 2, false]]) {
          const over = horizontal ? (i + j) % 2 === 0 : (i + j) % 2 !== 0;
          if (!over) continue;
          ctx.beginPath();
          ctx.arc(cx, cy, (R + Ri) / 2, dir - alpha, dir + alpha);
          ctx.strokeStyle = palette.bg;
          ctx.lineWidth = band + P.lineWidth * 3.2;
          ctx.stroke();
          const fill = tone(P.colorMode === 'gradient' ? ((i + j + 20) % 8) / 8 : 0.3);
          if (fill) {
            ctx.beginPath();
            ctx.arc(cx, cy, (R + Ri) / 2, dir - alpha, dir + alpha);
            ctx.strokeStyle = withAlpha(fill, 0.9);
            ctx.lineWidth = band;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(cx, cy, R, dir - alpha, dir + alpha);
          ctx.strokeStyle = ink;
          ctx.lineWidth = P.lineWidth;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, Ri, dir - alpha, dir + alpha);
          ctx.stroke();
        }
      }
    }
  }

  // ---- same-komon: shark skin — overlapping scale fans stippled from
  // thousands of fine dots, drawn far-to-near so each fan clips the last ----
  function drawSame() {
    const R = P.size * 1.6; // fan radius
    const rowStep = R * 0.52;
    const colStep = R * 2;
    const rings = 8;
    const dot = Math.max(0.8, P.lineWidth * 0.55);
    const rowsN = Math.ceil(D / rowStep) + 3;
    const colsN = Math.ceil(D / colStep) + 3;
    for (let j = -2; j < rowsN; j++) {
      const y = j * rowStep;
      const off = j % 2 === 0 ? 0 : colStep / 2;
      for (let i = -2; i < colsN; i++) {
        const x = i * colStep + off;
        // erase what's behind this fan so the scales overlap cleanly
        ctx.beginPath();
        ctx.arc(x, y, R * 0.98, 0, TAU);
        ctx.fillStyle = palette.bg;
        ctx.fill();
        const t = P.colorMode === 'gradient' ? ((j + 24) % 12) / 12 : 0.3;
        ctx.fillStyle = P.colorMode === 'ink' ? ink : samplePalette(palette.colors, 0.2 + t * 0.6);
        // one path holds every dot of the fan — a fill per dot would crawl
        ctx.beginPath();
        for (let k = 1; k <= rings; k++) {
          const rr = (R * k) / rings;
          const n = Math.max(6, Math.floor((Math.PI * rr) / (dot * 3.2)));
          for (let m = 0; m <= n; m++) {
            const ang = Math.PI + (m / n) * Math.PI; // the upper half-arc
            const px = x + Math.cos(ang) * rr;
            const py = y + Math.sin(ang) * rr;
            ctx.moveTo(px + dot, py);
            ctx.arc(px, py, dot, 0, TAU);
          }
        }
        ctx.fill();
      }
    }
  }

  // ---- amime: the fishing net — columns of taut arcs, adjacent columns
  // phase-flipped so the bulges kiss and knot into a mesh of lens cells ----
  function drawAmime() {
    const b = P.size * 0.5; // bulge = half the column pitch (bulges touch)
    const w = b * 2;
    const rho = b * P.stretch; // half-height of one arc segment
    const colsN = Math.ceil(D / w) + 2;
    const rowsN = Math.ceil(D / (rho * 2)) + 2;
    ctx.strokeStyle = ink;
    ctx.lineWidth = P.lineWidth;
    ctx.lineJoin = 'round';
    for (let i = -1; i < colsN + 1; i++) {
      const x = i * w;
      ctx.beginPath();
      ctx.moveTo(x, -rho * 2);
      for (let j = -1; j < rowsN; j++) {
        const y = j * rho * 2;
        const side = (i + j) % 2 === 0 ? 1 : -1;
        // quadratic through the apex (x + side·b, y + rho)
        ctx.quadraticCurveTo(x + side * b * 2, y + rho, x, y + rho * 2);
      }
      ctx.stroke();
    }
    // knots where neighbouring columns kiss
    if (P.knots) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      for (let i = -1; i < colsN + 1; i++) {
        for (let j = -1; j < rowsN; j++) {
          if ((((i + j) % 2) + 2) % 2 !== 0) continue; // columns kiss only here
          const kx = i * w + b;
          const ky = j * rho * 2 + rho;
          ctx.moveTo(kx + P.lineWidth * 0.9, ky);
          ctx.arc(kx, ky, P.lineWidth * 0.9, 0, TAU);
        }
      }
      ctx.fill();
    }
  }

  let drawn = false;
  return {
    frame() {
      if (drawn) return false;
      drawn = true;
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate((width - D) / 2, (height - D) / 2);
      if (style === 'koji') drawKoji();
      else if (style === 'shokko') drawShokko();
      else if (style === 'fundo') drawFundo();
      else if (style === 'wachigai') drawWachigai();
      else if (style === 'same') drawSame();
      else drawAmime();
      ctx.restore();
      return false;
    },
  };
}

const variant = (style, id, name, description, params) => ({
  id,
  name,
  category: 'Geometric',
  description,
  params,
  create(env) {
    return createEngine(style, env);
  },
});

export const WAGARA3_VARIANTS = [
  variant('koji', 'kojitsunagi', 'Kōji-tsunagi (工字繋ぎ)', 'Interlocking 工 glyphs — the woven key-fret lattice of Edo komon.', [
    P_SIZE, P_LINE,
    { key: 'link', label: 'Linkage', type: 'range', min: 0.6, max: 1, step: 0.02, value: 1 },
  ]),
  variant('shokko', 'shokko', 'Shokkō (蜀江)', 'Brocade of octagons and squares with flower-diamond hearts, after the silks of Shu.', [P_SIZE, P_LINE, P_CONTRAST, P_COLOR]),
  variant('fundo', 'fundo', 'Fundō-tsunagi (分銅繋ぎ)', 'Chained scale-weights: concave diamonds linked tip to tip, round voids blooming between.', [P_SIZE, P_LINE, P_CONTRAST, P_COLOR]),
  variant('wachigai', 'wachigai', 'Wachigai (輪違い)', 'Interlaced rings woven over and under — chain mail from the family-crest books.', [P_SIZE, P_LINE, P_CONTRAST, P_COLOR]),
  variant('same', 'samekomon', 'Same-komon (鮫小紋)', 'Shark skin: thousands of fine dots in overlapping scale arcs — stealth luxury of the Edo lords.', [P_SIZE, P_LINE, P_COLOR]),
  variant('amime', 'amime', 'Amime (網目)', 'The fishing net: taut arcs knotting into a mesh of lens-shaped cells.', [
    P_SIZE, P_LINE,
    { key: 'stretch', label: 'Mesh stretch', type: 'range', min: 1, max: 2.4, step: 0.05, value: 1.6 },
    { key: 'knots', label: 'Knots', type: 'checkbox', value: true },
  ]),
];
