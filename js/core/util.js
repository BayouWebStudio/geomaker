export const TAU = Math.PI * 2;

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([
    Math.round(lerp(ca[0], cb[0], t)),
    Math.round(lerp(ca[1], cb[1], t)),
    Math.round(lerp(ca[2], cb[2], t)),
  ]);
}

// Treat a palette's color list as one continuous gradient, t in [0, 1].
export function samplePalette(colors, t) {
  t = clamp(t, 0, 1);
  if (colors.length === 1) return colors[0];
  const f = t * (colors.length - 1);
  const i = Math.min(Math.floor(f), colors.length - 2);
  return mixHex(colors[i], colors[i + 1], f - i);
}

export function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
