// Curated palettes. `bg` is the canvas background; `colors` feed the artwork
// and are sampled as a continuous gradient (see samplePalette).

export const PALETTES = [
  { name: 'Porcelain', bg: '#f5f0e6', colors: ['#1c2541', '#2c4a7f', '#4f7cac', '#86a8c9'] },
  { name: 'Abyss', bg: '#061018', colors: ['#0d3b4f', '#15637f', '#2196a6', '#5fd0c7', '#c9f2e9'] },
  { name: 'Ember', bg: '#140d0b', colors: ['#641909', '#a83208', '#e25f1c', '#f7a325', '#ffe9b8'] },
  { name: 'Moss', bg: '#0c120a', colors: ['#1e3617', '#33591f', '#5d8a2e', '#9cb83b', '#e3e6a8'] },
  { name: 'Riso Pop', bg: '#f8f3e6', colors: ['#ff48b0', '#0078bf', '#ff6c2f', '#00a95c', '#765ba7'] },
  { name: 'Ultraviolet', bg: '#0e0716', colors: ['#391f63', '#6b2fa0', '#a64ac9', '#e173c9', '#ffd9f0'] },
  { name: 'Botanic', bg: '#f2eddd', colors: ['#33502f', '#5c7e4d', '#9bb068', '#c67b4e', '#80452f'] },
  { name: 'Sakura', bg: '#fdf3f0', colors: ['#465775', '#7d5ba6', '#d96098', '#e98ab4', '#f4b8c8'] },
  { name: 'Desert', bg: '#ece1cb', colors: ['#9c4a32', '#c97b4a', '#b89968', '#6f7556', '#3f4a5f'] },
  { name: 'Aurora', bg: '#070c14', colors: ['#0e4d45', '#19a974', '#5ce8b5', '#7f7fd5', '#b06ab3'] },
  { name: 'Honey', bg: '#fff8e7', colors: ['#283618', '#606c38', '#dda15e', '#b3722e', '#7f4f24'] },
  { name: 'Neon Garden', bg: '#0a0a12', colors: ['#ff2e88', '#ff8c42', '#ffe156', '#3bf4fb', '#9b5de5'] },
  { name: 'Ink', bg: '#f7f4ec', colors: ['#16161d', '#3c3c46'] },
  { name: 'Chalk', bg: '#0d0d0f', colors: ['#e8e8e3', '#9a9aa0'] },
];

export function getPalette(name) {
  return PALETTES.find((p) => p.name === name) || PALETTES[0];
}
