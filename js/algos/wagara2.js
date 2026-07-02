// Wagara II (和柄): a second family of classical Japanese patterns —
// Bishamon kikkō (the three-hex armor trefoil of Bishamonten), matsukawabishi
// (pine-bark diamonds), tatewaku (rising-steam waves), hanabishi (flower
// diamonds) and raimon (thunder-scroll spirals).

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'wagara2',
  name: 'Wagara II (和柄)',
  category: 'Geometric',
  description: 'More classical Japanese patterns: Bishamon kikkō armor, pine-bark diamonds, rising steam, flower diamonds and thunder scrolls.',
  params: [
    {
      key: 'style', label: 'Pattern', type: 'select', value: 'bishamon',
      options: [
        { value: 'bishamon', label: 'bishamon kikkō (armor)' },
        { value: 'matsukawa', label: 'matsukawabishi (pine bark)' },
        { value: 'tatewaku', label: 'tatewaku (rising steam)' },
        { value: 'hanabishi', label: 'hanabishi (flower diamond)' },
        { value: 'raimon', label: 'raimon (thunder scroll)' },
      ],
    },
    { key: 'size', label: 'Scale', type: 'range', min: 14, max: 90, step: 2, value: 42 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 10, step: 0.5, value: 2.5 },
    { key: 'contrast', label: 'Fill contrast', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'twotone',
      options: [
        { value: 'twotone', label: 'two-tone' },
        { value: 'gradient', label: 'gradient' },
        { value: 'ink', label: 'line only' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
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

    // ---- bishamon kikkō: partition the hex grid into 3-hex trefoils ----
    function drawBishamon() {
      const s = P.size / 2.6; // hex vertex radius
      const corner = (cx, cy, k) => {
        const a = (Math.PI / 3) * k - Math.PI / 2; // pointy-top
        return [cx + Math.cos(a) * s, cy + Math.sin(a) * s];
      };
      const center = (q, r) => [s * Math.sqrt(3) * (q + r / 2), s * 1.5 * r];
      const cols = Math.ceil(D / (s * Math.sqrt(3))) + 4;
      const rows = Math.ceil(D / (s * 1.5)) + 4;
      for (let r = -3; r < rows; r++) {
        for (let q = -3 - Math.ceil(r / 2); q < cols - Math.floor(r / 2); q++) {
          if (((q + 2 * r) % 3 + 3) % 3 !== 0) continue; // trefoil anchors only
          const cluster = [[q, r], [q + 1, r], [q, r + 1]];
          const t = ((q - r) % 5 + 5) % 5 / 5;
          const fill = tone(t);
          // collect the 18 edges; the 6 duplicated ones are the inner seams
          const edges = [];
          for (const [cq, cr] of cluster) {
            const [cx, cy] = center(cq, cr);
            for (let k = 0; k < 6; k++) {
              edges.push([corner(cx, cy, k), corner(cx, cy, (k + 1) % 6)]);
            }
          }
          if (fill) {
            ctx.fillStyle = fill;
            ctx.beginPath();
            for (const [cq, cr] of cluster) {
              const [cx, cy] = center(cq, cr);
              const [x0, y0] = corner(cx, cy, 0);
              ctx.moveTo(x0, y0);
              for (let k = 1; k < 6; k++) {
                const [x, y] = corner(cx, cy, k);
                ctx.lineTo(x, y);
              }
              ctx.closePath();
            }
            ctx.fill();
          }
          // stroke outer boundary bold (edges that appear once)
          ctx.strokeStyle = ink;
          ctx.lineWidth = P.lineWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i < edges.length; i++) {
            const [[ax, ay], [bx, by]] = edges[i];
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            let shared = false;
            for (let j = 0; j < edges.length; j++) {
              if (i === j) continue;
              const [[cx2, cy2], [dx, dy]] = edges[j];
              if (Math.abs((cx2 + dx) / 2 - mx) < 0.01 && Math.abs((cy2 + dy) / 2 - my) < 0.01) {
                shared = true;
                break;
              }
            }
            if (!shared) {
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
            }
          }
          ctx.stroke();
        }
      }
    }

    // ---- matsukawabishi: stepped pine-bark lozenges, two-tone lattice ----
    function drawMatsukawa() {
      const a = P.size / 2;
      const b = a * 0.62;
      const pts = [
        [0, -1.5 * b], [a / 2, -b], [a / 4, -0.75 * b], [a, 0],
        [a / 4, 0.75 * b], [a / 2, b], [0, 1.5 * b],
        [-a / 2, b], [-a / 4, 0.75 * b], [-a, 0],
        [-a / 4, -0.75 * b], [-a / 2, -b],
      ];
      const cols = Math.ceil(D / (2 * a)) + 2;
      const rows = Math.ceil(D / (1.5 * b)) + 3;
      for (let j = -2; j < rows; j++) {
        for (let i = -2; i < cols; i++) {
          const x = i * 2 * a + (j % 2 ? a : 0);
          const y = j * 1.5 * b;
          const fill = tone(((i + j) % 2 + 2) % 2 === 0 ? 0.25 : 0.75);
          ctx.beginPath();
          pts.forEach(([px, py], n) => (n === 0 ? ctx.moveTo(x + px, y + py) : ctx.lineTo(x + px, y + py)));
          ctx.closePath();
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          ctx.strokeStyle = ink;
          ctx.lineWidth = P.lineWidth;
          ctx.lineJoin = 'miter';
          ctx.stroke();
        }
      }
    }

    // ---- tatewaku: paired undulating verticals, swelling and pinching ----
    function drawTatewaku() {
      const W = P.size;
      const amp = W * 0.28;
      const lam = W * 3.2;
      const cols = Math.ceil(D / W) + 2;
      ctx.lineCap = 'round';
      for (let k = -1; k < cols; k++) {
        const flip = k % 2 === 0 ? 1 : -1;
        ctx.strokeStyle = P.colorMode === 'gradient' ? samplePalette(palette.colors, (k + 1) / cols) : ink;
        ctx.lineWidth = P.lineWidth;
        ctx.beginPath();
        for (let y = -lam; y <= D + lam; y += 6) {
          const x = k * W + Math.sin((y / lam) * TAU) * amp * flip;
          y <= -lam + 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // ---- hanabishi: four curved petals in a diamond lattice ----
    function drawHanabishi() {
      const a = P.size / 2;
      const b = a * 0.78;
      const cols = Math.ceil(D / (2 * a)) + 2;
      const rows = Math.ceil(D / b) + 2;
      for (let j = -1; j < rows; j++) {
        for (let i = -1; i < cols; i++) {
          const x = i * 2 * a + (j % 2 ? a : 0);
          const y = j * b;
          const fill = tone(((i * 3 + j) % 4 + 4) % 4 / 4);
          for (let p = 0; p < 4; p++) {
            const ang = (p / 4) * TAU;
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);
            const tipX = x + cos * 0 - sin * -b * 0.82;
            const tipY = y + sin * 0 + cos * -b * 0.82;
            const c1x = x + cos * (a * 0.42) - sin * (-b * 0.4);
            const c1y = y + sin * (a * 0.42) + cos * (-b * 0.4);
            const c2x = x + cos * (-a * 0.42) - sin * (-b * 0.4);
            const c2y = y + sin * (-a * 0.42) + cos * (-b * 0.4);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
            ctx.quadraticCurveTo(c2x, c2y, x, y);
            ctx.closePath();
            if (fill) {
              ctx.fillStyle = fill;
              ctx.fill();
            }
            ctx.strokeStyle = ink;
            ctx.lineWidth = P.lineWidth * 0.8;
            ctx.stroke();
          }
        }
      }
    }

    // ---- raimon: square thunder-scroll spirals, alternating chirality ----
    function drawRaimon() {
      const s = P.size;
      const cols = Math.ceil(D / s) + 2;
      ctx.lineCap = 'square';
      for (let j = -1; j < cols; j++) {
        for (let i = -1; i < cols; i++) {
          const cx = i * s + s / 2;
          const cy = j * s + s / 2;
          const dir = (i + j) % 2 === 0 ? 1 : -1;
          const turns = 3;
          const step = (s * 0.82) / (turns * 2);
          ctx.strokeStyle = P.colorMode === 'gradient'
            ? samplePalette(palette.colors, ((i + j + cols) % cols) / cols)
            : ink;
          ctx.lineWidth = P.lineWidth;
          ctx.beginPath();
          let x = cx - (s * 0.41) * dir;
          let y = cy - s * 0.41;
          ctx.moveTo(x, y);
          let len = s * 0.82;
          let d = 0; // 0 right, 1 down, 2 left, 3 up
          while (len > step * 0.6) {
            const dx = [dir, 0, -dir, 0][d];
            const dy = [0, 1, 0, -1][d];
            x += dx * len;
            y += dy * len;
            ctx.lineTo(x, y);
            d = (d + 1) % 4;
            if (d === 1 || d === 3) len -= step;
          }
          ctx.stroke();
        }
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
        if (P.style === 'bishamon') drawBishamon();
        else if (P.style === 'matsukawa') drawMatsukawa();
        else if (P.style === 'tatewaku') drawTatewaku();
        else if (P.style === 'hanabishi') drawHanabishi();
        else drawRaimon();
        ctx.restore();
        return false;
      },
    };
  },
};
