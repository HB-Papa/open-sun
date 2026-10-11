import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  CELLS,
  countParts,
  generatePuzzle,
  HOURS,
  mulberry32,
  PART_ORDER,
  simulate,
  buildable,
  type Layout,
  type Variant,
} from '../lib/microgrid.ts';

const START = '2026-10-11';

test('every daily puzzle for the next 60 days is solvable within budget', () => {
  for (let d = 0; d < 60; d++) {
    const key = addDays(START, d);
    const p = generatePuzzle(key);
    assert.ok(countParts(p.solution) <= p.budget, `${key}: solution over budget`);
    p.solution.forEach((part, i) => {
      if (part) assert.ok(buildable(p.terrain[i]), `${key}: part on unbuildable cell ${i}`);
    });
    assert.equal(simulate(p, p.solution).litCount, HOURS, `${key}: solution does not light all hours`);
  }
});

test('bonus variants are solvable', () => {
  const variants: Variant[] = ['commons', 'storm', 'garden', 'longnight'];
  for (const v of variants) {
    for (let d = 0; d < 10; d++) {
      const p = generatePuzzle(addDays(START, d), v, `note-${d}`);
      assert.equal(simulate(p, p.solution).litCount, HOURS, `${v} day ${d}`);
    }
  }
});

test('generation is deterministic', () => {
  const a = generatePuzzle('2027-01-05', 'daily', 'x');
  const b = generatePuzzle('2027-01-05', 'daily', 'x');
  assert.deepEqual(a, b);
});

test('placement matters: random layouts rarely win', () => {
  let wins = 0;
  let total = 0;
  for (let d = 0; d < 20; d++) {
    const p = generatePuzzle(addDays(START, d));
    const r = mulberry32(d + 1);
    const free = p.terrain.map((t, i) => (buildable(t) ? i : -1)).filter((i) => i >= 0);
    for (let k = 0; k < 200; k++) {
      const layout: Layout = new Array(CELLS).fill(null);
      const cells = free.slice().sort(() => r() - 0.5).slice(0, p.budget);
      for (const c of cells) layout[c] = PART_ORDER[Math.floor(r() * PART_ORDER.length)];
      total++;
      if (simulate(p, layout).litCount === HOURS) wins++;
    }
  }
  const rate = wins / total;
  console.log(`random win rate: ${(rate * 100).toFixed(1)}%`);
  assert.ok(rate < 0.1, `random layouts win too often (${rate})`);
});
