'use client';

import { useState } from 'react';
import { hourLabel, HOURS, RULES, type Puzzle, type SimResult } from '@/lib/microgrid';
import { MoonGlyph, SunGlyph } from '@/components/icons';

const AXIS = [
  { h: 0, label: '12 am' },
  { h: 6, label: '6 am' },
  { h: 12, label: 'Noon' },
  { h: 18, label: '6 pm' },
  { h: 23, label: '11 pm' },
];

function Axis() {
  return (
    <div className="relative mt-1 h-4 text-[12px] text-muted" aria-hidden="true">
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
      <span className="pb-0.5 text-[13px] font-bold text-muted">{label}</span>
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
      <p className="mt-2 min-h-[1.5em] text-[14px] text-body" aria-hidden="true">
        {hover === null
          ? 'Hover or tap an hour to see its numbers.'
          : `${cap(hourLabel(hover))}: sun ${pct(puzzle.sun[hover])} (${puzzle.sky[hover]}), wind ${pct(puzzle.wind[hover])}, demand ${demand[hover].toFixed(1)} units.`}
      </p>
      <figcaption className="text-[15px] leading-snug text-body">{forecastSentence(puzzle, demand)}</figcaption>
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
    ['Use', demand, maxDemand, 'var(--terracotta)', undefined],
  ];
  return (
    <div className={`flex flex-col gap-1 rounded-[16px] border border-line bg-card px-3 py-2.5 ${className}`} aria-hidden="true">
      {rows.map(([label, values, max, color, dim]) => (
        <div key={label} className="grid grid-cols-[40px_1fr] items-end gap-2">
          <span className="text-[12px] font-bold text-muted">{label}</span>
          <div className="flex h-5 items-end gap-[2px]">
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
      <div className="grid grid-cols-[40px_1fr] gap-2">
        <span />
        <div className="flex justify-between text-[12px] text-muted">
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
          <span className="text-[13px] font-bold text-on-forest-muted">Lights</span>
          <div className="flex gap-[2px]" onMouseLeave={() => setHover(null)}>
            {lit.map((ok, h) => (
              <div
                key={h}
                onMouseEnter={() => setHover(h)}
                className="flex h-7 flex-1 items-center justify-center rounded-[4px] transition-colors duration-200"
                style={{
                  background: h > upTo ? 'var(--forest-2)' : ok ? '#E3A72F' : '#4A5A50',
                  outline: hover === h ? '2px solid #F6F1E4' : undefined,
                }}
              >
                {h <= upTo && (ok ? <SunGlyph className="hidden h-3 w-3 sm:block" /> : <MoonGlyph className="h-3 w-3" />)}
              </div>
            ))}
          </div>
        </div>
        {sim && sim.capacity > 0 && (
          <div className="grid grid-cols-[64px_1fr] items-end gap-2">
            <span className="text-[13px] font-bold text-on-forest-muted">Battery</span>
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
      <p className="mt-2 min-h-[1.5em] text-[14px] text-on-forest-muted" aria-hidden="true">
        {hover === null || hover > upTo
          ? 'A sun means that hour stayed lit; a moon means it went dark.'
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
