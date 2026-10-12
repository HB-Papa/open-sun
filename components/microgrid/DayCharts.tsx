'use client';

import { useState } from 'react';
import { hourLabel, HOURS, RULES, type Puzzle, type SimResult } from '@/lib/microgrid';
import { MoonGlyph } from '@/components/icons';
import { Nums } from '@/lib/nums';

const AXIS = [
  { h: 0, label: '12 am' },
  { h: 6, label: '6 am' },
  { h: 12, label: 'Noon' },
  { h: 18, label: '6 pm' },
  { h: 23, label: '11 pm' },
];

function Axis() {
  return (
    <div className="relative mt-1 h-4 text-micro text-muted" aria-hidden="true">
      {AXIS.map((a) => (
        <span
          key={a.h}
          className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
          style={{ left: `${((a.h + (a.h === 23 ? 1 : 0)) / HOURS) * 100}%` }}
        >
          {a.label}
        </span>
      ))}
    </div>
  );
}

function Strip({
  label,
  values,
  max,
  color,
  hover,
  setHover,
  dim,
}: {
  label: string;
  values: number[];
  max: number;
  color: string;
  hover: number | null;
  setHover: (h: number | null) => void;
  dim?: boolean[];
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-end gap-2">
      <span className="pb-0.5 text-caption font-bold text-muted">{label}</span>
      <div className="flex h-10 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {values.map((v, h) => (
          <div
            key={h}
            className="relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(h)}
            style={{ background: hover === h ? 'var(--chip)' : undefined, borderRadius: 3 }}
          >
            <div
              className="w-full"
              style={{
                height: `${Math.max(v > 0 ? 6 : 0, (v / max) * 100)}%`,
                background: color,
                opacity: dim?.[h] ? 0.45 : 1,
                borderRadius: '4px 4px 1px 1px',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Today's sun, wind and demand, as three labelled strips plus a text table. */
export function ForecastChart({ puzzle, demand }: { puzzle: Puzzle; demand: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxDemand = Math.max(...demand);
  const cloudy = puzzle.sky.map((s) => s === 'cloudy' || s === 'hazy');
  return (
    <figure className="m-0">
      <div className="flex flex-col gap-1.5" aria-hidden="true">
        <Strip label="Sun" values={puzzle.sun} max={1} color="var(--sun)" hover={hover} setHover={setHover} dim={cloudy} />
        <Strip label="Wind" values={puzzle.wind} max={1} color="var(--sky)" hover={hover} setHover={setHover} />
        <Strip label="Demand" values={demand} max={maxDemand} color="var(--terracotta)" hover={hover} setHover={setHover} />
        <div className="grid grid-cols-[64px_1fr] gap-2">
          <span />
          <Axis />
        </div>
      </div>
      {/* A keyboard-friendly way to step through the hours, alongside hover and tap. */}
      <label className="mt-2 grid grid-cols-[58px_1fr] items-center gap-2 text-caption font-bold text-muted">
        Hour
        <input
          type="range"
          min={0}
          max={HOURS - 1}
          value={hover ?? 12}
          onChange={(e) => setHover(Number(e.target.value))}
          onFocus={() => setHover((h) => h ?? 12)}
          aria-valuetext={hover === null ? undefined : hourReadout(puzzle, demand, hover)}
          className="hour-range h-6 w-full"
          style={{ ['--fill' as string]: `${(((hover ?? 12) / (HOURS - 1)) * 100).toFixed(1)}%` }}
        />
      </label>
      <p className="mt-1 min-h-[1.5em] text-small text-body" aria-hidden="true">
        {hover === null ? 'Hover, tap, or use the slider to see an hour’s numbers.' : <Nums text={hourReadout(puzzle, demand, hover)} />}
      </p>
      <figcaption className="text-small leading-snug text-body">
        <Nums text={forecastSentence(puzzle, demand)} />
      </figcaption>
      <table className="sr-only">
        <caption>Hour-by-hour forecast</caption>
        <thead>
          <tr>
            <th scope="col">Hour</th>
            <th scope="col">Sky</th>
            <th scope="col">Sun</th>
            <th scope="col">Wind</th>
            <th scope="col">Demand (units)</th>
          </tr>
        </thead>
        <tbody>
          {demand.map((d, h) => (
            <tr key={h}>
              <th scope="row">{hourLabel(h)}</th>
              <td>{puzzle.sky[h]}</td>
              <td>{pct(puzzle.sun[h])}</td>
              <td>{pct(puzzle.wind[h])}</td>
              <td>{d.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** A compact, label-only version of the forecast for planning beside the board on phones. */
export function MiniForecast({ puzzle, demand, className = '' }: { puzzle: Puzzle; demand: number[]; className?: string }) {
  const maxDemand = Math.max(...demand);
  const cloudy = puzzle.sky.map((s) => s === 'cloudy' || s === 'hazy');
  const rows: [string, number[], number, string, boolean[] | undefined][] = [
    ['Sun', puzzle.sun, 1, 'var(--sun)', cloudy],
    ['Wind', puzzle.wind, 1, 'var(--sky)', undefined],
    ['Demand', demand, maxDemand, 'var(--terracotta)', undefined],
  ];
  return (
    <div className={`flex flex-col gap-1 rounded-[16px] border border-line bg-card px-3 py-2 ${className}`} aria-hidden="true">
      {rows.map(([label, values, max, color, dim]) => (
        <div key={label} className="grid grid-cols-[58px_1fr] items-end gap-2">
          <span className="text-micro font-bold text-muted">{label}</span>
          <div className="flex h-4 items-end gap-[2px]">
            {values.map((v, h) => (
              <div
                key={h}
                className="flex-1"
                style={{ height: `${Math.max(v > 0 ? 10 : 0, (v / max) * 100)}%`, background: color, opacity: dim?.[h] ? 0.45 : 1, borderRadius: '2px 2px 0 0' }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[58px_1fr] gap-2">
        <span />
        <div className="flex justify-between text-micro text-muted">
          <span>12 am</span>
          <span>Noon</span>
          <span>11 pm</span>
        </div>
      </div>
    </div>
  );
}

/** After a run: which hours stayed lit, and how full the batteries were. */
export function ResultChart({ lit, sim, upTo }: { lit: boolean[]; sim?: SimResult; upTo: number }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure className="m-0">
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[64px_1fr] items-center gap-2">
          <span className="text-caption font-bold text-on-forest-muted">Lights</span>
          {/* Lit hours stand tall in gold; dark hours sit low with a moon. The height says it without colour, and
              min-w-0 lets all 24 cells share the width evenly on the narrowest phones. */}
          <div className="flex h-7 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {lit.map((ok, h) => (
              <div
                key={h}
                onMouseEnter={() => setHover(h)}
                className={`flex min-w-0 flex-1 items-center justify-center rounded-[4px] transition-[background-color,height] duration-200 ${
                  h <= upTo && !ok ? 'h-4' : 'h-7'
                }`}
                style={{
                  background: h > upTo ? 'var(--forest-2)' : ok ? '#E3A72F' : '#4A5A50',
                  outline: hover === h ? '2px solid #F6F1E4' : undefined,
                }}
              >
                {h <= upTo && !ok && <MoonGlyph className="h-auto w-full max-w-3" />}
              </div>
            ))}
          </div>
        </div>
        {sim && sim.capacity > 0 && (
          <div className="grid grid-cols-[64px_1fr] items-end gap-2">
            <span className="text-caption font-bold text-on-forest-muted">Battery</span>
            <div className="flex h-8 items-end gap-[2px]">
              {sim.storage.map((s, h) => (
                <div key={h} className="flex h-full flex-1 items-end rounded-[3px] bg-forest-2">
                  <div
                    className="w-full rounded-t-[4px] rounded-b-[1px] bg-meadow transition-[height] duration-200"
                    style={{ height: h > upTo ? 0 : `${(s / sim.capacity) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 min-h-[1.5em] text-small text-on-forest-muted" aria-hidden="true">
        {hover === null || hover > upTo
          ? 'Tall gold bars are hours that stayed lit; short bars with a moon went dark.'
          : `${cap(hourLabel(hover))}: ${lit[hover] ? 'lit' : 'dark'}.${
              sim
                ? ` Made ${sim.supply[hover].toFixed(1)}, needed ${sim.demand[hover].toFixed(1)}${
                    sim.capacity ? `, battery ${Math.round((sim.storage[hover] / sim.capacity) * 100)}% full` : ''
                  }.`
                : ''
            }`}
      </p>
    </figure>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const hourReadout = (p: Puzzle, demand: number[], h: number) =>
  `${cap(hourLabel(h))}: sun ${pct(p.sun[h])} (${p.sky[h]}), wind ${pct(p.wind[h])}, demand ${demand[h].toFixed(1)} units.`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ranges(flags: boolean[]): string[] {
  const out: string[] = [];
  let h = 0;
  while (h < HOURS) {
    if (!flags[h]) {
      h++;
      continue;
    }
    const s = h;
    while (h < HOURS && flags[h]) h++;
    out.push(s === h - 1 ? hourLabel(s) : `${hourLabel(s)} to ${hourLabel(h - 1)}`);
  }
  return out;
}

export function forecastSentence(p: Puzzle, demand: number[]): string {
  const clouds = ranges(p.sky.map((s) => s === 'cloudy'));
  const haze = ranges(p.sky.map((s) => s === 'hazy'));
  const windy = ranges(p.wind.map((w) => w >= 0.6));
  const calm = ranges(p.wind.map((w) => w < 0.2));
  const peak = demand.indexOf(Math.max(...demand));
  const parts = [`Sunrise ${hourLabel(p.sunrise)}, sunset ${hourLabel(p.sunset)}.`];
  if (clouds.length) parts.push(`Heavy cloud ${clouds.join(' and ')}.`);
  if (haze.length) parts.push(`Light cloud ${haze.join(' and ')}.`);
  if (!clouds.length && !haze.length) parts.push('Clear skies all day.');
  parts.push(windy.length ? `Windy ${windy.join(', ')}.` : 'No strong wind today.');
  if (calm.length) parts.push(`Calm ${calm.join(', ')}.`);
  parts.push(`Demand peaks around ${hourLabel(peak)}. Batteries start the day ${RULES.batteryStart * 100}% full.`);
  return parts.join(' ');
}
