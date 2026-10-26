import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countParts, HOURS, simulate } from '../lib/microgrid.ts';
import { buildSteps, TUTORIAL_PUZZLE as p } from '../lib/tutorial.ts';

test('the tutorial example grid is solved by its answer, using every piece and every kind of ground', () => {
  assert.equal(simulate(p, p.solution).litCount, HOURS);
  for (const kind of ['solar', 'wind', 'battery', 'garden'] as const) assert.ok(p.solution.includes(kind), kind);
  for (const t of ['ridge', 'tree', 'pond', 'rock', 'home'] as const) assert.ok(p.terrain.includes(t), t);
});

test('the tutorial builds the answer up step by step, with clean notes', () => {
  const steps = buildSteps();
  assert.equal(countParts(steps[steps.length - 1].layout), countParts(p.solution));
  for (const s of steps) {
    assert.ok(s.title && s.note);
    assert.doesNotMatch(s.note, /undefined|NaN|null|;|\s{2}|\s[.,]|\.\./, `"${s.title}": ${s.note}`);
  }
  // Each run step shows the homes lit at that hour.
  const sim = simulate(p, p.solution);
  for (const s of steps.filter((x) => x.panel === 'run')) assert.ok(sim.lit[s.hour!], s.title);
});
