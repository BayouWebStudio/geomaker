// Deterministic seeded randomness: xmur3 string hash feeding mulberry32.
// The same seed string always reproduces the same artwork.

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function createRng(seedStr) {
  let a = xmur3(String(seedStr))();
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  return {
    random: next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    gaussian() {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      let u, v, s;
      do {
        u = next() * 2 - 1;
        v = next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return u * m;
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

// Friendly, memorable seeds for the dice button (intentionally non-deterministic).
const WORDS = (
  'amber briar coral drift ember fjord grove heron iris juniper kelp lumen ' +
  'moss nectar opal petal quartz reed sable thorn umbra vine willow yarrow ' +
  'zephyr ash birch cedar dune fern lichen tide'
).split(' ');

export function randomSeedString() {
  const w = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${w}-${Math.floor(Math.random() * 9000 + 1000)}`;
}
