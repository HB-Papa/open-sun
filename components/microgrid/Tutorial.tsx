'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { baseDemand, cellMultipliers, connectedParts, simulate, type Layout, type Puzzle } from '@/lib/microgrid';
import { buildSteps, TUTORIAL_PUZZLE as puzzle, type Step } from '@/lib/tutorial';
import { BatteryIcon, GardenIcon, HomeIcon, PondIcon, RidgeMark, RockIcon, SolarIcon, TreeIcon, WindIcon } from '@/components/icons';
import { Nums } from '@/lib/nums';
import { ForecastChart, ResultChart } from './DayCharts';
import { PART_BG, PART_NAME, TERRAIN_BG, washFor } from './tiles';

/**
 * A step-through of one example grid (never a real day's puzzle), solved a piece at a time,
 * with a short note on each step saying what the board shows and why it works.
 */
export function Tutorial({ onClose }: { onClose: () => void }) {
  const [k, setK] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const steps = useMemo(() => buildSteps(), []);

  const step = steps[k];
  const last = k === steps.length - 1;
  const sim = simulate(puzzle, puzzle.solution);
  const controls = (
    <>
      {k > 0 && (
        <button type="button" onClick={() => setK(k - 1)} className="min-h-12 rounded-full border-2 border-line-strong bg-card px-5 font-bold text-ink hover:border-leaf">
          Back
        </button>
      )}
      <button
        type="button"
        onClick={() => (last ? onClose() : setK(k + 1))}
        className={`min-h-12 rounded-full px-6 font-bold ${last ? 'bg-sun text-[#1E3328]' : 'bg-leaf text-white'} max-md:flex-1`}
      >
        {last ? 'Play today’s puzzle' : 'Next'}
      </button>
    </>
  );

  return (
    <section aria-labelledby="tut-h" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 id="tut-h" ref={headingRef} tabIndex={-1} className="font-serif text-section font-bold leading-tight outline-none sm:text-page-lg">
            How to play Microgrid
          </h1>
          <p className="mt-1 hidden text-copy text-body sm:block">
            A walk through an example grid, solved one step at a time.
          </p>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 font-bold text-sky underline">
          Skip to today’s puzzle
        </button>
      </div>

      {/* Where you are in the walk-through. */}
      <ol className="flex gap-1" aria-label={`Step ${k + 1} of ${steps.length}`}>
        {steps.map((s, i) => (
          <li key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${i <= k ? 'bg-leaf' : 'bg-line'}`} aria-hidden="true" />
        ))}
      </ol>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-8">
        {/* The board comes first, so each step's change is in view; on wide screens it sits on the left. */}
        <TutorialBoard puzzle={puzzle} step={step} stepKey={k} />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-5">
            <p className="text-caption font-bold text-muted">
              Step <span className="num">{k + 1}</span> of <span className="num">{steps.length}</span>
            </p>
            <div aria-live="polite" className="flex flex-col gap-2">
              <h2 className="font-serif text-heading font-semibold leading-snug">{step.title}</h2>
              <p className="text-copy leading-normal text-body">
                <Nums text={step.note} />
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="contents max-md:hidden">{controls}</span>
              {last && (
                <button type="button" onClick={() => setK(0)} className="min-h-12 px-2 font-bold text-sky underline">
                  Start again
                </button>
              )}
            </div>
          </div>
          {step.panel === 'forecast' && (
            <div className="rounded-[20px] border border-line bg-card p-5">
              <h3 className="mb-3 font-serif text-title font-semibold">Yesterday’s forecast</h3>
              <ForecastChart puzzle={puzzle} demand={baseDemand(puzzle)} />
            </div>
          )}
          {step.panel === 'run' && step.hour !== undefined && (
            <div className="on-forest flex flex-col gap-3 rounded-[20px] bg-forest p-5 text-on-forest">
              <h3 className="font-serif text-title font-semibold">
                <span className="num">{sim.lit.slice(0, step.hour + 1).filter(Boolean).length}</span> of 24 hours lit
              </h3>
              <ResultChart lit={sim.lit} sim={sim} upTo={step.hour} />
            </div>
          )}
        </div>
      </div>

      {/* Phones: Back and Next stay within thumb's reach, like the game's run bar. */}
      <div className="run-bar fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-card px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(13,24,18,.35)] md:hidden">
        <span className="shrink-0 text-small text-muted">
          <span className="num">{k + 1}</span>/<span className="num">{steps.length}</span>
        </span>
        {controls}
      </div>
    </section>
  );
}

function TutorialBoard({ puzzle, step, stepKey }: { puzzle: Puzzle; step: Step; stepKey: number }) {
  const { layout, highlight, hour } = step;
  const connected = connectedParts(puzzle.terrain, layout);
  const mult = cellMultipliers(puzzle, layout, connected);
  const sim = hour !== undefined ? simulate(puzzle, layout) : null;
  const pointing = highlight.length > 0;
  return (
    <div
      role="img"
      aria-label={boardText(puzzle, layout)}
      className={`board board-fit grid grid-cols-5 gap-2 rounded-[22px] p-3 shadow-[inset_0_2px_6px_rgba(30,51,40,.15)] sm:p-3.5 ${step.light === 'night' ? 'is-night' : ''}`}
      style={{ '--wash': step.light === 'night' ? washFor('night', 0) : step.light === 'day' ? washFor('sunny', 1) : undefined } as React.CSSProperties}
    >
      {puzzle.terrain.map((t, i) => {
        const part = layout[i];
        const m = mult[i];
        const on = highlight.includes(i);
        const arriving = step.placed?.includes(i);
        return (
          <div
            key={i}
            className={`plot relative flex aspect-square min-h-11 items-center justify-center rounded-xl transition-opacity duration-200 ${
              on ? 'outline outline-[3px] outline-offset-2 outline-sun' : ''
            }`}
            style={{ background: part ? PART_BG[part] : TERRAIN_BG[t], opacity: pointing && !on ? 0.4 : 1 }}
          >
            {t === 'ridge' && <RidgeMark />}
            {t === 'home' && <HomeIcon lit={sim ? sim.lit[hour!] : null} />}
            {t === 'tree' && <TreeIcon />}
            {t === 'pond' && <PondIcon />}
            {t === 'rock' && <RockIcon />}
            {part && (
              <span key={`${part}-${arriving ? stepKey : 0}`} className={`flex h-full w-full items-center justify-center ${arriving ? 'piece-in' : ''}`}>
                {part === 'solar' && <SolarIcon />}
                {part === 'wind' && <WindIcon />}
                {part === 'battery' && <BatteryIcon level={sim && sim.capacity ? sim.storage[hour!] / sim.capacity : -1} />}
                {part === 'garden' && <GardenIcon />}
              </span>
            )}
            {part && connected[i] && (part === 'solar' || part === 'wind') && m !== 1 && (
              <span aria-hidden="true" className="absolute right-1 top-1 rounded-full bg-card px-1.5 text-micro font-bold leading-[18px] text-ink shadow-sm">
                ×{Number.isInteger(m) ? m : m.toFixed(2).replace(/0$/, '')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function boardText(p: Puzzle, layout: Layout): string {
  const parts = layout.map((part, i) => (part ? `${PART_NAME[part]} at row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}` : null)).filter(Boolean);
  const homes = p.terrain.filter((t) => t === 'home').length;
  return `The map: ${homes} homes${parts.length ? `; ${parts.join('; ')}` : ', no pieces placed yet'}.`;
}
