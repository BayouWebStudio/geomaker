// Node smoke test for the DOM-free modules: determinism, value ranges,
// palette integrity and algorithm parameter schemas.

import assert from 'node:assert/strict';
import { createRng, randomSeedString } from '../js/core/rng.js';
import { createNoise } from '../js/core/noise.js';
import { PALETTES } from '../js/core/palettes.js';
import { samplePalette, mixHex, withAlpha, clamp } from '../js/core/util.js';
import { ALGORITHMS } from '../js/algos/index.js';

// rng determinism + bounds
{
  const a = createRng('hello');
  const b = createRng('hello');
  const c = createRng('other');
  const seqA = Array.from({ length: 8 }, a.random);
  const seqB = Array.from({ length: 8 }, b.random);
  assert.deepEqual(seqA, seqB, 'same seed must reproduce the same sequence');
  assert.notDeepEqual(seqA, Array.from({ length: 8 }, c.random), 'different seeds must diverge');
  for (const v of seqA) assert.ok(v >= 0 && v < 1);
  const r = createRng('x');
  for (let i = 0; i < 1000; i++) {
    const v = r.range(-3, 7);
    assert.ok(v >= -3 && v < 7);
    const n = r.int(2, 5);
    assert.ok(Number.isInteger(n) && n >= 2 && n <= 5);
  }
  assert.match(randomSeedString(), /^[a-z]+-\d{4}$/);
}

// noise determinism + sane output range
{
  const n1 = createNoise(createRng('noise-seed'));
  const n2 = createNoise(createRng('noise-seed'));
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < 4000; i++) {
    const x = (i % 64) * 0.13;
    const y = Math.floor(i / 64) * 0.17;
    const v = n1.noise3(x, y, 0.5);
    assert.equal(v, n2.noise3(x, y, 0.5), 'seeded noise must be deterministic');
    assert.ok(Math.abs(v) <= 1.1, `noise out of range: ${v}`);
    const f = n1.fbm(x, y, 0.5, 4);
    assert.ok(Math.abs(f) <= 1.1, `fbm out of range: ${f}`);
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  assert.ok(min < -0.3 && max > 0.3, 'noise should actually vary');
}

// palettes + color helpers
{
  const hex = /^#[0-9a-f]{6}$/;
  assert.ok(PALETTES.length >= 10);
  for (const p of PALETTES) {
    assert.ok(p.name && hex.test(p.bg), `bad bg in ${p.name}`);
    assert.ok(p.colors.length >= 1);
    for (const c of p.colors) assert.ok(hex.test(c), `bad color ${c} in ${p.name}`);
  }
  assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(samplePalette(['#000000', '#ffffff'], 0), '#000000');
  assert.equal(samplePalette(['#000000', '#ffffff'], 1), '#ffffff');
  assert.equal(samplePalette(['#123456'], 0.7), '#123456');
  assert.equal(withAlpha('#ff0000', 0.5), 'rgba(255,0,0,0.5)');
  assert.equal(clamp(5, 0, 3), 3);
}

// algorithm registry + parameter schemas
{
  assert.equal(ALGORITHMS.length, 5);
  const ids = new Set();
  for (const algo of ALGORITHMS) {
    assert.ok(algo.id && algo.name && algo.description);
    assert.ok(!ids.has(algo.id), `duplicate algo id ${algo.id}`);
    ids.add(algo.id);
    assert.equal(typeof algo.create, 'function');
    const keys = new Set();
    for (const def of algo.params) {
      assert.ok(def.key && def.label, `param missing key/label in ${algo.id}`);
      assert.ok(!keys.has(def.key), `duplicate param ${def.key} in ${algo.id}`);
      keys.add(def.key);
      if (def.type === 'select') {
        assert.ok(def.options.some((o) => o.value === def.value), `default not in options: ${algo.id}.${def.key}`);
      } else if (def.type === 'checkbox') {
        assert.equal(typeof def.value, 'boolean');
      } else {
        assert.ok(def.type === 'range', `unknown control type in ${algo.id}.${def.key}`);
        assert.ok(def.min <= def.value && def.value <= def.max, `default out of range: ${algo.id}.${def.key}`);
      }
    }
  }
}

console.log('smoke ok');
