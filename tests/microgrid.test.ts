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
  shareText,
  buildable,
  difficultyFor,
  HARDER_FROM,
  maxScale,
  neighbors,
  SLACK,
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

test('share text uses real emoji, not garbled characters', () => {
  const lit = Array.from({ length: HOURS }, (_, h) => h < 21);
  const { emoji, plain } = shareText(1, false, 3, lit);
  assert.match(emoji, /^Open Sun · Microgrid #1\n🌙 21\/24 hours lit after 3 tries\n/);
  assert.ok(emoji.includes('🟨'.repeat(12)) && emoji.includes('⬛'));
  assert.equal(plain, 'Open Sun Microgrid #1: lit 21 of 24 hours after 3 tries.');
  // Typical signs of text decoded with the wrong character set.
  assert.doesNotMatch(emoji + plain, /[ÃÂâð]/);
});

test('the share grid is two rows of 12 whole hours, with no split emoji', () => {
  // Mixed lit and dark hours: a split by string index would cut a 🟨 in half.
  const lit = Array.from({ length: HOURS }, (_, h) => !(h >= 3 && h < 6) && h < 21);
  const rows = shareText(2, false, 3, lit).emoji.split('\n').slice(2);
  assert.equal(rows.length, 2);
  for (const r of rows) {
    assert.ok(r.isWellFormed(), 'no half emoji');
    assert.equal([...r].length, 12);
  }
  assert.equal(rows.join(''), lit.map((ok) => (ok ? '🟨' : '⬛')).join(''));
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

test('puzzles before the harder date are unchanged; later ones follow the weekly ramp', () => {
  // The day before HARDER_FROM keeps the original settings and has no rocks.
  const before = addDays(HARDER_FROM, -1);
  assert.deepEqual(difficultyFor(before), { slack: SLACK, rocks: 0 });
  assert.ok(!generatePuzzle(before).terrain.includes('rock'));
  for (let d = 0; d < 14; d++) {
    const key = addDays(HARDER_FROM, d);
    const level = difficultyFor(key);
    assert.ok(level.slack > SLACK, `${key}: harder demand`);
    const p = generatePuzzle(key);
    const rocks = p.terrain.map((t, i) => (t === 'rock' ? i : -1)).filter((i) => i >= 0);
    assert.equal(rocks.length, level.rocks, `${key}: rock count`);
    for (const i of rocks) assert.ok(!neighbors(i).some((n) => p.terrain[n] === 'home'), `${key}: rock next to a home`);
    assert.equal(simulate(p, p.solution).litCount, HOURS, `${key}: still solvable`);
  }
});

test('a strong greedy player no longer wins every harder puzzle on the first try', () => {
  // Adds, one at a time, whichever part on whichever plot carries the most demand.
  function greedy(p: ReturnType<typeof generatePuzzle>): Layout {
    const layout: Layout = new Array(CELLS).fill(null);
    for (let k = 0; k < p.budget; k++) {
      let best: [number, (typeof PART_ORDER)[number], number] | null = null;
      for (let i = 0; i < CELLS; i++) {
        if (!buildable(p.terrain[i]) || layout[i]) continue;
        for (const part of PART_ORDER) {
          layout[i] = part;
          const s = maxScale(p, layout);
          layout[i] = null;
          if (!best || s > best[0]) best = [s, part, i];
        }
      }
      if (!best) break;
      layout[best[2]] = best[1];
    }
    return layout;
  }
  let wins = 0;
  const days = 28;
  for (let d = 0; d < days; d++) {
    const p = generatePuzzle(addDays(HARDER_FROM, d));
    if (simulate(p, greedy(p)).litCount === HOURS) wins++;
  }
  console.log(`greedy first-try win rate on harder puzzles: ${Math.round((wins / days) * 100)}%`);
  assert.ok(wins / days < 0.9, `greedy wins too often (${wins}/${days})`);
});
