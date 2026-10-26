import { baseDemand, hourLabel, hourRanges, HOURS, neighbors, simulate, type Layout, type Part, type Puzzle } from './microgrid.ts';

export type Step = {
  title: string;
  note: string;
  layout: Layout;
  /** Plots to point at; the rest of the board steps back. */
  highlight: number[];
  /** Pieces that arrive on this step. */
  placed?: number[];
  panel?: 'forecast' | 'run';
  /** For run steps: the hour the day has reached, and whether it's night or day over the board. */
  hour?: number;
  light?: 'night' | 'day';
};

const PART_PLURAL: Record<Part, string> = { solar: 'solar panels', wind: 'turbines', battery: 'batteries', garden: 'gardens' };

const list = (xs: string[], and = 'and') => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`);
/** "from 5 pm to 6 pm" or "at 10 am", for hour ranges in a sentence. */
const when = (rs: string[]) => list(rs.map((r) => (r.includes(' to ') ? `from ${r}` : `at ${r}`)));

/** The walk-through for one solved grid: the goal, the forecast, the map, each kind of piece, then the day itself. */
export function buildSteps(p: Puzzle): Step[] {
  const sol = p.solution;
  const empty: Layout = sol.map(() => null);
  const homes = p.terrain.flatMap((t, i) => (t === 'home' ? [i] : []));
  const cellsOf = (kind: Part) => sol.flatMap((x, i) => (x === kind ? [i] : []));
  const touches = (i: number, test: (n: number) => boolean) => neighbors(i).some(test);
  const steps: Step[] = [];

  steps.push({
    title: 'A new grid every day',
    note: 'Every day brings a new map and new weather, the same for everyone. Sunny, windy and cloudy days each need a different mix of pieces. This is yesterday’s grid: let’s solve it together.',
    layout: empty,
    highlight: [],
  });
  steps.push({
    title: 'Keep every home lit',
    note: `The goal is to keep all ${homes.length} homes lit for 24 hours, using up to ${p.budget} pieces. Homes use power every hour, and most of all in the evening.`,
    layout: empty,
    highlight: homes,
  });

  const demand0 = baseDemand(p);
  const peak0 = demand0.indexOf(Math.max(...demand0));
  const avgWind = p.wind.reduce((a, b) => a + b, 0) / HOURS;
  const windyHours = p.wind.filter((w) => w >= 0.6).length;
  const heavy = p.sky.filter((x) => x === 'cloudy').length;
  const light = p.sky.filter((x) => x === 'hazy').length;
  const sky = heavy >= 4 ? 'a lot of cloud' : heavy + light > 0 ? 'mostly sunshine with a little cloud' : 'clear skies';
  const wind = windyHours >= 8 ? 'a strong wind for much of the day' : avgWind < 0.3 ? 'very little wind' : 'some wind';
  const counts = (['solar', 'wind', 'battery'] as Part[]).map((kind) => [kind, sol.filter((x) => x === kind).length] as const).filter(([, n]) => n > 0);
  const leans = counts.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([kind]) => PART_PLURAL[kind]);
  steps.push({
    title: 'Read the forecast',
    note: `The forecast shows how much sun and wind each hour brings, and how much power the homes need. Yesterday had ${sky} and ${wind}, and demand peaked around ${hourLabel(peak0)}. This answer leans on ${list(leans)}.`,
    layout: empty,
    highlight: [],
    panel: 'forecast',
  });

  const has = (t: string) => p.terrain.includes(t as never);
  const mapNotes = ['Pieces go on open ground.'];
  if (has('ridge')) mapNotes.push('A windy ridge makes a turbine stronger.');
  if (has('tree')) mapNotes.push('Trees shade the panels next to them.');
  const blocked = [has('pond') && 'ponds', has('rock') && 'rocky ground'].filter(Boolean) as string[];
  if (blocked.length) mapNotes.push(`Nothing can be built on ${list(blocked, 'or')}${has('rock') ? ', and power can’t cross rocky ground' : ''}.`);
  steps.push({
    title: 'Read the map',
    note: mapNotes.join(' '),
    layout: empty,
    highlight: p.terrain.flatMap((t, i) => (t === 'ridge' || t === 'tree' || t === 'pond' || t === 'rock' ? [i] : [])),
  });

  // The pieces, one kind at a time, building up the solution.
  const layout: Layout = empty.slice();
  const order: Part[] = ['solar', 'garden', 'wind', 'battery'];
  for (const kind of order) {
    const cells = cellsOf(kind);
    if (!cells.length) continue;
    cells.forEach((i) => (layout[i] = kind));
    const one = cells.length === 1;
    let note = '';
    if (kind === 'solar') {
      const shaded = cells.filter((i) => touches(i, (n) => p.terrain[n] === 'tree'));
      note = 'Solar panels make power while the sun is up, and none at night. ';
      if (!sol.includes('wind')) note += 'With so little wind yesterday, sunshine is the main source of power. ';
      note += shaded.length
        ? `${shaded.length === 1 ? 'One sits' : `${shaded.length} sit`} beside a tree, so ${shaded.length === 1 ? 'it makes' : 'they make'} half as much (see the ×0.5).`
        : `${one ? 'This one sits' : 'These sit'} away from the trees, so ${one ? 'it gets' : 'they get'} full sun.`;
    } else if (kind === 'garden') {
      const boosted = sol.some((x, i) => x === 'solar' && touches(i, (n) => sol[n] === 'garden'));
      const cooledHome = homes.some((h) => touches(h, (n) => sol[n] === 'garden'));
      note = 'A garden makes no power itself. ';
      note += boosted ? 'It cools the panels beside it, so they make 1.5 times as much (see the ×1.5 badges).' : 'It cools any panels beside it, so they make more.';
      if (cooledHome) note += ' Next to a home, it also keeps the home cool on hot afternoons, so the home needs less power.';
    } else if (kind === 'wind') {
      const windy = hourRanges(p.wind.map((w) => w >= 0.6));
      const ridged = cells.filter((i) => p.terrain[i] === 'ridge');
      note = `Turbines make power day and night, whenever the wind blows${windy.length ? `. Yesterday was windiest ${when(windy)}` : ''}. `;
      if (ridged.length) note += `${ridged.length === cells.length ? (one ? 'This one stands' : 'These stand') : 'One stands'} on a windy ridge, which makes 1.5 times as much. `;
      note += 'Keep turbines apart: side by side, they steal each other’s wind.';
    } else {
      note = `Batteries store spare power for later, usually daytime sun for the night. ${one ? 'It starts' : 'Each one starts'} the day half full. `;
      note += sol.includes('wind')
        ? `Together with the turbines, ${one ? 'it carries' : 'they carry'} the night.`
        : `With no wind to help after dark, the nights run entirely on stored sun, which is why this answer uses ${one ? 'a battery' : `${cells.length} batteries`}.`;
    }
    steps.push({
      title: `Add ${one ? (kind === 'battery' ? 'a battery' : kind === 'garden' ? 'a garden' : kind === 'wind' ? 'a turbine' : 'a solar panel') : PART_PLURAL[kind]}`,
      note,
      layout: layout.slice(),
      highlight: cells,
      placed: cells,
    });
  }

  // The kinds this answer skipped: not every piece is needed every day.
  const unused = order.filter((kind) => !cellsOf(kind).length);
  if (unused.length) {
    steps.push({
      title: 'Not every piece, every day',
      note: `This answer uses no ${list(unused.map((u) => PART_PLURAL[u]), 'or')}. You pick the mix that suits the day’s weather; on another day, ${unused.length === 1 ? 'they' : 'those'} might be the key.`,
      layout: layout.slice(),
      highlight: [],
    });
  }

  const pieces = sol.flatMap((x, i) => (x ? [i] : []));
  steps.push({
    title: 'Connect everything',
    note: `Every piece must connect to a home, directly or through the pieces it touches. A piece on its own makes nothing${has('rock') ? ', and power can’t cross rocky ground' : ''}. That’s all ${pieces.length} pieces placed.`,
    layout: layout.slice(),
    highlight: [...pieces, ...homes],
  });

  // Then run the day, in three stretches: before sunrise, daylight, and the evening.
  const sim = simulate(p, sol);
  const supplied = (a: number, b: number) => sim.supply.slice(a, b + 1).some((s) => s > 0.01);
  const drew = (a: number, b: number) => sim.capacity > 0 && sim.storage[b] < (a === 0 ? sim.capacity / 2 : sim.storage[a - 1]) - 0.01;
  const carriers = (a: number, b: number) => {
    const w = supplied(a, b) && sol.includes('wind');
    const s = drew(a, b);
    return w && s ? 'the turbines and batteries' : s ? (sol.filter((x) => x === 'battery').length === 1 ? 'the battery' : 'the batteries') : 'the turbines';
  };
  const rise = p.sunrise;
  const set = p.sunset;
  if (rise > 0) {
    steps.push({
      title: 'Run the day: the early hours',
      note: `When you run the day, it plays out hour by hour. From midnight until sunrise at ${hourLabel(rise)}, there’s no sun, so ${carriers(0, rise - 1)} keep the homes lit.`,
      layout: layout.slice(),
      highlight: [],
      panel: 'run',
      hour: rise - 1,
      light: 'night',
    });
  }
  const full = sim.capacity ? sim.storage.findIndex((s, h) => h >= rise && h < set && s >= sim.capacity - 0.01) : -1;
  const clouds = hourRanges(p.sky.map((s) => s === 'cloudy'));
  const daySources = sol.includes('solar') ? (sol.includes('wind') && supplied(rise, set - 1) ? 'the panels and turbines' : 'the panels') : 'the turbines';
  let dayNote = `From sunrise at ${hourLabel(rise)} until sunset at ${hourLabel(set)}, ${daySources} power the homes${sim.capacity ? ', and the spare power fills the batteries' : ''}.`;
  if (full >= 0) dayNote += ` They’re full by ${hourLabel(full)}.`;
  if (clouds.length && sol.includes('solar')) dayNote += ` The cloud ${when(clouds)} slows the panels, but there’s enough.`;
  steps.push({
    title: 'Daylight',
    note: dayNote,
    layout: layout.slice(),
    highlight: [],
    panel: 'run',
    hour: set - 1,
    light: 'day',
  });
  const demand = sim.demand;
  const peak = demand.indexOf(Math.max(...demand));
  const left = sim.capacity ? Math.round((sim.storage[HOURS - 1] / sim.capacity) * 100) : null;
  steps.push({
    title: 'The evening',
    note: `The homes need the most power around ${hourLabel(peak)}, as the sun goes down. After sunset, ${carriers(set, HOURS - 1)} carry the homes through to midnight${
      left === null || carriers(set, HOURS - 1) === 'the turbines' ? '' : carriers(set, HOURS - 1).includes('turbines') ? `, and the batteries end the day ${left}% full` : `, ending the day ${left}% full`
    }.`,
    layout: layout.slice(),
    highlight: [],
    panel: 'run',
    hour: HOURS - 1,
    light: 'night',
  });
  steps.push({
    title: 'Solved',
    note: 'All 24 hours lit: that’s a solved grid. You get three tries a day, and after each run the Lights row shows which hours went dark, so you can see what to change. Today brings new weather, so today’s answer will be different.',
    layout: layout.slice(),
    highlight: [],
    panel: 'run',
    hour: HOURS - 1,
  });
  return steps;
}
