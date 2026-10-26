import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, countParts, generatePuzzle, HOURS, simulate } from '../lib/microgrid.ts';
import { buildSteps } from '../lib/tutorial.ts';

const days = Array.from({ length: 60 }, (_, k) => addDays('2026-10-11', k));

test('the tutorial builds a sensible walk-through for any day', () => {
  for (const day of days) {
    const p = generatePuzzle(day);
    const steps = buildSteps(p);
    // The answer it walks through really does light every hour.
    assert.equal(simulate(p, p.solution).litCount, HOURS, day);
    assert.ok(steps.length >= 9 && steps.length <= 14, `${day}: ${steps.length} steps`);
    const final = steps[steps.length - 1];
    assert.equal(countParts(final.layout), countParts(p.solution), day);
    for (const s of steps) {
      assert.ok(s.title && s.note, day);
      assert.doesNotMatch(s.note, /undefined|NaN|null|\s{2}|\s[.,]|\.\./, `${day} "${s.title}": ${s.note}`);
      assert.ok(s.note.split(' ').length <= 70, `${day} "${s.title}" is ${s.note.split(' ').length} words`);
    }
  }
});

test('each kind of piece in the answer gets its own step, and unused kinds are named', () => {
  for (const day of days) {
    const p = generatePuzzle(day);
    const titles = buildSteps(p).map((s) => s.title);
    for (const kind of ['solar', 'wind', 'battery', 'garden'] as const) {
      const used = p.solution.includes(kind);
      const hasStep = titles.some((t) => t.toLowerCase().includes({ solar: 'solar', wind: 'turbine', battery: 'batter', garden: 'garden' }[kind]));
      assert.equal(hasStep, used, `${day} ${kind}`);
    }
    if (p.solution.includes('wind') && p.solution.includes('battery') && p.solution.includes('solar') && p.solution.includes('garden')) continue;
    assert.ok(titles.includes('Not every piece, every day'), day);
  }
});
