import { baseDemand, connectedParts, hourLabel, hourRanges, HOURS, neighbors, simulate, type Layout, type Part } from './microgrid.ts';
import { TUTORIAL_PUZZLE as p } from './tutorialPuzzle.ts';

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

/**
 * The walk-through of the example grid: the goal, the forecast, the map, each kind of piece as the answer is built,
 * then the day itself. The words are written for this one grid; the times and figures in them are read from it,
 * so they always match the board and charts.
 */
export function buildSteps(): Step[] {
  const sol = p.solution;
  const empty: Layout = sol.map(() => null);
  const homes = p.terrain.flatMap((t, i) => (t === 'home' ? [i] : []));
  const cellsOf = (kind: Part) => sol.flatMap((x, i) => (x === kind ? [i] : []));
  const sim = simulate(p, sol);
  const demand = baseDemand(p);
  const peak = hourLabel(demand.indexOf(Math.max(...demand)));
  const rise = p.sunrise;
  const set = p.sunset;
  const full = sim.storage.findIndex((s, h) => h >= rise && s >= sim.capacity - 0.01);
  const cloud = hourRanges(p.sky.map((s) => s === 'cloudy'))[0];
  const left = Math.round((sim.storage[HOURS - 1] / sim.capacity) * 100);

  // The answer goes on one kind at a time, in the order the notes explain them.
  const layouts: Record<Part, Layout> = {} as Record<Part, Layout>;
  const building: Layout = empty.slice();
  for (const kind of ['solar', 'garden', 'wind', 'battery'] as Part[]) {
    cellsOf(kind).forEach((i) => (building[i] = kind));
    layouts[kind] = building.slice();
  }
  const pieces = sol.flatMap((x, i) => (x ? [i] : []));
  const newlyLinked = (before: Layout, after: Layout) => {
    const was = connectedParts(p.terrain, before);
    const now = connectedParts(p.terrain, after);
    return before.flatMap((x, i) => (x && !was[i] && now[i] ? [i] : []));
  };

  return [
    {
      title: 'A new grid every day',
      note: 'Every day brings a new map and new weather, the same for everyone. Sunny, windy and cloudy days each need a different mix of pieces. Here’s an example grid that uses every kind of piece. Let’s solve it together.',
      layout: empty,
      highlight: [],
    },
    {
      title: 'Keep every home lit',
      note: 'The goal is to keep all homes lit for 24 hours using different combos of green energy producers. Homes use power every hour, most of all in the evening.',
      layout: empty,
      highlight: homes,
    },
    {
      title: 'Read the forecast',
      note: `The forecast shows how much sun and wind each hour brings, and how much power the homes need (demand). This grid has mostly sunshine, a little cloud and some wind. Demand peaks around ${peak}, just before the sun sets.`,
      layout: empty,
      highlight: [],
      panel: 'forecast',
    },
    {
      title: 'Read the map',
      note: 'Pieces go on open ground. A windy ridge makes a turbine stronger. Trees shade solar panels placed next to them, reducing their efficiency. Nothing can be built on ponds or rocky ground, and power can’t cross rocky ground.',
      layout: empty,
      highlight: p.terrain.flatMap((t, i) => (t === 'ridge' || t === 'tree' || t === 'pond' || t === 'rock' ? [i] : [])),
    },
    {
      title: 'Add a solar panel',
      note: 'Solar panels make power while the sun is up, and produce no electricity at night. This one sits away from the trees, so it gets full sun.',
      layout: layouts.solar,
      highlight: cellsOf('solar'),
      placed: cellsOf('solar'),
    },
    {
      title: 'Add a garden',
      note: 'A garden makes no power itself. It cools the solar panels beside it, so they make 1.5 times as much (see the ×1.5 badge). Next to a home, it also keeps the home cool on hot afternoons, so the home needs less power.',
      layout: layouts.garden,
      // The garden, and the panel and homes beside it that it cools.
      highlight: [...cellsOf('garden'), ...cellsOf('garden').flatMap((g) => neighbors(g).filter((n) => sol[n] === 'solar' || p.terrain[n] === 'home'))],
      placed: cellsOf('garden'),
    },
    {
      title: 'Add turbines',
      note: 'Turbines make power day and night, whenever the wind blows. These two stand on windy ridges, which makes them 1.5 times as strong. Keep turbines apart. Side by side, they’re less effective. The top one isn’t linked to a home yet, so its badge stays grey until the next step.',
      layout: layouts.wind,
      highlight: cellsOf('wind'),
      placed: cellsOf('wind'),
    },
    {
      title: 'Add batteries',
      note: 'Batteries store spare power for later, usually daytime sun for the night. Each one starts the day half full. The one beside the top turbine links it to a home, so its badge turns on. Together with the turbines, they carry the homes through the dark.',
      layout: layouts.battery,
      // The batteries, and any piece they link to a home on this step (its badge turns on).
      highlight: [...cellsOf('battery'), ...newlyLinked(layouts.wind, layouts.battery)],
      placed: cellsOf('battery'),
    },
    {
      title: 'Connect everything',
      note: 'Every piece must connect to a home, directly or through the pieces it touches. A piece on its own makes nothing, and power can’t cross rocky ground.',
      layout: sol,
      highlight: [...pieces, ...homes],
    },
    {
      title: 'Run the day: the early hours',
      note: `When you run the day, it plays out hour by hour. From midnight until sunrise at ${hourLabel(rise)}, there’s no sun, so the turbines and batteries keep the homes lit.`,
      layout: sol,
      highlight: [],
      panel: 'run',
      hour: rise - 1,
      light: 'night',
    },
    {
      title: 'Daylight',
      note: `From sunrise at ${hourLabel(rise)} until sunset at ${hourLabel(set)}, the solar panel and turbines power the homes, and the spare power fills the batteries. They’re full by ${hourLabel(full)}. Cloud from ${cloud} slows the panel, but there’s enough power to go around.`,
      layout: sol,
      highlight: [],
      panel: 'run',
      hour: set - 1,
      light: 'day',
    },
    {
      title: 'The evening',
      note: `Homes need the most power around ${peak}, as the sun goes down. After sunset, the turbines and batteries carry the homes through to midnight, and the batteries end the day ${left}% full.`,
      layout: sol,
      highlight: [],
      panel: 'run',
      hour: HOURS - 1,
      light: 'night',
    },
    {
      title: 'Solved',
      note: 'All 24 hours lit: that’s a solved grid. You get three tries a day. After each run, the Lights row shows which hours went dark, so you can see what to change.',
      layout: sol,
      highlight: [],
      panel: 'run',
      hour: HOURS - 1,
    },
    {
      title: 'Every day is different',
      note: 'Each day’s grid has its own map and forecast. Your goal is to pick the mix that best suits the day’s weather. On a windy day, turbines may be the answer. On a calm, sunny one, solar panels and batteries may do most of the work.',
      layout: sol,
      highlight: [],
    },
  ];
}

export { p as TUTORIAL_PUZZLE };
