'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { localDateKey, puzzleNumber } from '@/lib/microgrid';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

type Palette = { sky: string; sky2: string; sun: string; far: string; mid: string; near: string; front: string; panel: string; line: string; text: string; soft: string };

export const PALETTES: Record<Phase, Palette> = {
  dawn: { sky: '#F6D9B8', sky2: '#F3E3B5', sun: '#EFA04A', far: '#B8C996', mid: '#7FA877', near: '#3E7C4F', front: '#2F6B45', panel: '#2A7C86', line: '#2F5E40', text: '#1E3328', soft: '#2E3E34' },
  day: { sky: '#F3E3B5', sky2: '#F6ECCB', sun: '#E3A72F', far: '#B5CC98', mid: '#7FA877', near: '#3E7C4F', front: '#2F6B45', panel: '#1F6F78', line: '#2F5E40', text: '#1E3328', soft: '#2E3E34' },
  dusk: { sky: '#EBC0A0', sky2: '#F0D2B4', sun: '#D9773F', far: '#A3B58B', mid: '#6E8E62', near: '#3A6646', front: '#2A5639', panel: '#245E66', line: '#24452F', text: '#1E3328', soft: '#2E3E34' },
  night: { sky: '#1B2D3A', sky2: '#22394A', sun: '#F1E6C2', far: '#2E4A3B', mid: '#26402F', near: '#1D3326', front: '#14251B', panel: '#1E4C55', line: '#3E5F4B', text: '#F6F1E4', soft: '#DCE6D8' },
};

/** The sky follows the visitor's local time, and stays at night in dark mode. */
export function useSkyPhase(): Phase | null {
  // Unknown until the browser reports its clock and theme, so nothing paints in the wrong sky first.
  const [phase, setPhase] = useState<Phase | null>(null);
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const tick = () => setPhase(dark.matches ? 'night' : phaseFor(new Date().getHours()));
    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    dark.addEventListener('change', tick);
    return () => {
      clearInterval(id);
      dark.removeEventListener('change', tick);
    };
  }, []);
  return phase;
}

function phaseFor(h: number): Phase {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

const r1 = (n: number) => Math.round(n * 10) / 10;

const INK = '#1E3328';

/** A window with a cross mullion; the glass follows the time of day. */
function Pane({ x, y, w, h, glass }: { x: number; y: number; w: number; h: number; glass: string }) {
  return (
    <g>
      <rect className="pane" x={x} y={y} width={w} height={h} fill={glass} stroke={INK} strokeWidth="2" style={{ transition: 'fill 1s' }} />
      <path d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`} stroke={INK} strokeWidth="1.4" />
    </g>
  );
}

/** Little clumps of grass and wildflowers for living roofs and planters. */
function Tufts({ points, leaf, flowers = true }: { points: [number, number][]; leaf: string; flowers?: boolean }) {
  return (
    <g>
      {points.map(([x, y], k) => (
        <g key={k}>
          <path d={`M${x - 4} ${y} q2 -7 4 -9 q1 5 1 9 q2 -6 5 -7 q-1 4 -2 7 Z`} fill={leaf} />
          {flowers && k % 2 === 0 && <circle cx={x + 1} cy={y - 8} r="1.8" fill={k % 4 === 0 ? '#E3A72F' : '#F0D6D0'} />}
        </g>
      ))}
    </g>
  );
}

/** Three eco homes: a green-roofed cottage, a gabled house with a living roof, and a two-storey house with a roof garden and a climbing vine. */
export function EcoHomes({ night, glass, leaf, turf }: { night: boolean; glass: string; leaf: string; turf: string }) {
  const wood = night ? '#A88C66' : '#D9B98C';
  const cream = night ? '#CDBF97' : '#F3E3B5';
  const clay = night ? '#B89D8A' : '#E6CBB5';
  return (
    <g strokeLinejoin="round">
      {/* Cottage with a sloping sod roof, a big window and a flower box. */}
      <g style={{ ['--d' as string]: '0.2s' }}>
      <rect x="664" y="262" width="66" height="42" fill={wood} stroke={INK} strokeWidth="2" />
      <path d="M672 266 V302 M682 266 V302 M720 266 V302" stroke={INK} strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M656 266 L738 252 L738 245 L656 259 Z" fill={turf} stroke={INK} strokeWidth="2" />
      <Tufts leaf={leaf} points={[[662, 258], [674, 256], [688, 254], [702, 251], [716, 249], [730, 247]]} />
      <Pane x={670} y={272} w={28} h={18} glass={glass} />
      <path d="M708 304 V286 a7 7 0 0 1 14 0 V304 Z" fill="#6B4A2E" stroke={INK} strokeWidth="2" />
      <rect x="668" y="291" width="32" height="6" fill="#6B4A2E" stroke={INK} strokeWidth="1.5" />
      <Tufts leaf={leaf} points={[[673, 291], [683, 291], [693, 291]]} />

      </g>

      {/* Gabled house with a living roof and a round window under the ridge. */}
      <g style={{ ['--d' as string]: '0.9s' }}>
      <rect x="762" y="254" width="82" height="46" fill={cream} stroke={INK} strokeWidth="2" />
      <path d="M754 258 L803 214 L852 258 L844 258 L803 222 L762 258 Z" fill={turf} stroke={INK} strokeWidth="2" />
      <path d="M762 258 L803 222 L844 258 Z" fill={cream} />
      <path d="M762 258 L803 222 L844 258" fill="none" stroke={INK} strokeWidth="2" />
      <Tufts leaf={leaf} points={[[764, 252], [776, 241], [788, 230], [818, 230], [830, 241], [842, 252]]} />
      <circle className="pane" cx="803" cy="241" r="7" fill={glass} stroke={INK} strokeWidth="2" style={{ transition: 'fill 1s' }} />
      <Pane x={770} y={264} w={18} h={26} glass={glass} />
      <Pane x={818} y={264} w={18} h={26} glass={glass} />
      <path d="M795 300 V280 a8 8 0 0 1 16 0 V300 Z" fill="#6B4A2E" stroke={INK} strokeWidth="2" />
      <circle cx="758" cy="294" r="7" fill={leaf} />
      <circle cx="849" cy="295" r="6" fill={leaf} />

      </g>

      {/* Two-storey house with a roof garden, wide windows and a climbing vine. */}
      <g style={{ ['--d' as string]: '1.6s' }}>
      <rect x="868" y="238" width="62" height="56" fill={clay} stroke={INK} strokeWidth="2" />
      <rect x="863" y="232" width="72" height="7" fill={wood} stroke={INK} strokeWidth="2" />
      <circle cx="874" cy="229" r="6" fill={leaf} />
      <circle cx="886" cy="227" r="7" fill={turf} />
      <circle cx="914" cy="228" r="6" fill={leaf} />
      <circle cx="926" cy="229" r="5" fill={turf} />
      <Pane x={876} y={245} w={46} h={16} glass={glass} />
      <Pane x={876} y={270} w={20} h={16} glass={glass} />
      <path d="M904 294 V276 a6 6 0 0 1 12 0 V294 Z" fill="#6B4A2E" stroke={INK} strokeWidth="2" />
      <path d="M931 294 C925 282 935 272 929 262 S933 248 928 238" fill="none" stroke={leaf} strokeWidth="2.5" strokeLinecap="round" />
      {[[930, 284], [929, 270], [931, 256], [928, 244]].map(([x, y], k) => (
        <path key={k} d={k % 2 ? `M${x} ${y} c-6 -1 -8 -6 -6 -9 c4 1 6 5 6 9Z` : `M${x} ${y} c6 -1 8 -6 6 -9 c-4 1 -6 5 -6 9Z`} fill={leaf} />
      ))}
      </g>
    </g>
  );
}

/** A small community solar array on racks, with wildflowers growing underneath. */
export function SolarArray({ panel, night }: { panel: string; night: boolean }) {
  const frame = night ? '#7E9CA2' : '#FFFDF7';
  const leg = night ? '#3E4F45' : '#4A5A50';
  const rows = [
    { y: 276, w: 32, h: 12, xs: [972, 1010, 1048, 1086] },
    { y: 298, w: 38, h: 15, xs: [956, 999, 1042, 1085] },
  ];
  return (
    <g>
      {rows.map((r, ri) => (
        <g key={ri}>
          {/* The shared rack rail that ties each row together. */}
          <path d={`M${r.xs[0] + 2} ${r.y + 4} H${r.xs[r.xs.length - 1] + r.w - 2}`} stroke={leg} strokeWidth="2.5" strokeLinecap="round" />
          {r.xs.map((x) => {
            // A module tilted toward the sun: the top edge leans back and up.
            const lean = r.h * 0.45;
            const top = r.y - r.h;
            return (
              <g key={x}>
                <path d={`M${x + 5} ${r.y} v8 M${x + r.w - 5} ${r.y} v8`} stroke={leg} strokeWidth="2" strokeLinecap="round" />
                <path d={`M${x} ${r.y} L${x + r.w} ${r.y} L${x + r.w + lean} ${top} L${x + lean} ${top} Z`} fill={panel} stroke={frame} strokeWidth="1.6" strokeLinejoin="round" />
                <path
                  d={`M${r1(x + r.w / 3)} ${r.y} L${r1(x + r.w / 3 + lean)} ${top} M${r1(x + (2 * r.w) / 3)} ${r.y} L${r1(x + (2 * r.w) / 3 + lean)} ${top} M${r1(x + lean / 2)} ${r1(r.y - r.h / 2)} L${r1(x + r.w + lean / 2)} ${r1(r.y - r.h / 2)}`}
                  stroke={frame}
                  strokeOpacity="0.55"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          {/* Grazing grass and flowers between the rows (agrivoltaics). */}
          {r.xs.map((x, k) => (
            <g key={`f${x}`}>
              <path d={`M${x + 12} ${r.y + 9} q2 -6 3 -8 q1 4 1 8 Z`} fill={night ? '#4F7F5A' : '#5E9467'} />
              <circle cx={x + 22} cy={r.y + 6} r="1.8" fill={k % 2 ? '#F0D6D0' : '#E3A72F'} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

/**
 * The home page header: a small solarpunk village whose sky follows the visitor's
 * local time (and stays at night in dark mode). The headline sits on open sky.
 */
export function Hero() {
  const phase = useSkyPhase();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const sunY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 50]);
  const farY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 20]);
  const midY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 10]);

  const ready = phase !== null;
  const p = PALETTES[phase ?? 'day'];
  const night = phase === 'night';
  const lit = night || phase === 'dusk';
  const [puzzleNo, setPuzzleNo] = useState<number | null>(null);
  useEffect(() => setPuzzleNo(puzzleNumber(localDateKey())), []);
  const sun = phase === 'dawn' ? { x: 990, y: 190 } : phase === 'dusk' ? { x: 1000, y: 196 } : phase === 'night' ? { x: 980, y: 96 } : { x: 975, y: 110 };
  // Glass reflects the sky by day and glows gold once the lamps come on.
  const glass = lit ? '#E8B547' : '#CDE4E6';
  const leaf = night ? '#4F7F5A' : '#5E9467';
  const turf = night ? '#2F5A3C' : '#3E7C4F';

  return (
    <section
      className="relative overflow-hidden md:min-h-[520px]"
      // Until the sky is known the band is plain paper (light or dark), then the sky fades in: no bright flash.
      style={{ background: ready ? `linear-gradient(${p.sky}, ${p.sky2})` : 'var(--paper)' }}
    >
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pb-4 pt-7 sm:px-6 sm:pb-6 sm:pt-9 md:pb-40 md:pt-16">
        <div className="max-w-[540px] md:max-w-[480px]" style={{ color: ready ? p.text : 'var(--ink)' }}>
          {/* On phones, today's puzzle comes first. */}
          <Link
            href="/play"
            className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-current px-4 text-small font-bold no-underline md:hidden"
            style={{ color: ready ? p.text : 'var(--ink)' }}
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-sun" />
            Daily puzzle: keep a village lit · Play{puzzleNo ? ` #${puzzleNo}` : ''}
          </Link>
          <h1 className="mb-4 font-serif text-page font-bold leading-[1.02] tracking-[-0.01em] text-balance sm:text-hero">A free library for a solarpunk tomorrow</h1>
          <p className="mb-6 max-w-[46ch] text-copy leading-normal sm:text-lede" style={{ color: ready ? p.soft : 'var(--body)' }}>
            <span className="sm:hidden">Free writing on a future powered by the sun and built around community.</span>
            <span className="hidden sm:inline">
              Solarpunk imagines a future powered by the sun, woven into living ecosystems, and built around community. Here is open access writing on it, gathered in one
              place and updated every week.
            </span>
          </p>
          <form role="search" action="/library" className="flex flex-wrap gap-2.5">
            <label htmlFor="home-search" className="sr-only">
              Search the library
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Try: agrivoltaics"
              className="min-h-12 flex-[1_1_220px] rounded-full border-2 border-line-strong bg-input px-4 text-copy text-ink shadow-[0_2px_10px_rgba(30,51,40,.08)] placeholder:text-muted"
            />
            <button type="submit" className="min-h-12 rounded-full bg-leaf px-[22px] font-bold text-white">
              Search
            </button>
          </form>
          <p className="mt-4 text-copy">
            <Link href="/library/flynn-2014-solarpunk-notes-manifesto" className="font-bold underline decoration-2" style={{ color: ready ? p.text : 'var(--ink)' }}>
              New to solarpunk? Start with one short essay
            </Link>
          </p>
        </div>
      </div>

      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMaxYMax slice"
        // On desktop the scene sits along the bottom at its own proportions (not stretched to the copy's height),
        // so the village stays below and to the right of the search, whatever the text wraps to.
        className="block h-[120px] w-full transition-opacity duration-700 sm:h-[260px] md:absolute md:inset-x-0 md:bottom-0 md:h-auto md:max-h-full"
        style={{ opacity: ready ? 1 : 0 }}
        aria-hidden="true"
      >
        {night && (
          <g fill="#F6F1E4">
            {[
              [620, 40], [700, 90], [760, 30], [840, 70], [1080, 60], [1150, 30], [1010, 150], [880, 140], [560, 120], [1180, 120], [680, 170], [420, 60], [300, 30], [160, 80],
            ].map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 2.2 : 1.4} opacity={0.85} />
            ))}
          </g>
        )}

        {/* A stained-glass sun: a leaded disc ringed with petal rays. */}
        <motion.g style={{ y: sunY }}>
          {!night && (
            <g fill={p.sun} opacity="0.9">
              {Array.from({ length: 16 }, (_, k) => {
                const a = (k / 16) * 360;
                return <ellipse key={k} cx={sun.x} cy={r1(sun.y - 82)} rx="7" ry="15" transform={`rotate(${a} ${sun.x} ${sun.y})`} />;
              })}
            </g>
          )}
          <circle cx={sun.x} cy={sun.y} r={night ? 44 : 60} fill={p.sun} />
          {!night && (
            <g stroke="#FFFDF7" strokeOpacity="0.55" strokeWidth="2" fill="none">
              <circle cx={sun.x} cy={sun.y} r="42" />
              {Array.from({ length: 6 }, (_, k) => {
                const a = (k / 6) * Math.PI * 2 + 0.3;
                return <line key={k} x1={r1(sun.x + Math.cos(a) * 42)} y1={r1(sun.y + Math.sin(a) * 42)} x2={r1(sun.x + Math.cos(a) * 60)} y2={r1(sun.y + Math.sin(a) * 60)} />;
              })}
            </g>
          )}
          {night && <circle cx={sun.x + 18} cy={sun.y - 10} r={40} fill={p.sky} />}
        </motion.g>

        {/* Far hills, with a turbine on the ridge. */}
        <motion.g style={{ y: farY }}>
          <path d="M0 292 C200 226 380 252 560 270 C760 290 930 222 1200 246 L1200 420 L0 420 Z" fill={p.far} />
          <g stroke={night ? '#9FB3B5' : '#FFFDF7'} strokeWidth="3" strokeLinecap="round">
            <line x1="1156" y1="248" x2="1156" y2="172" />
            <g className="turbine-spin" style={{ transformOrigin: '1156px 172px', transformBox: 'view-box', animationDuration: '9s' }}>
              <line x1="1156" y1="172" x2="1156" y2="134" />
              <line x1="1156" y1="172" x2="1123" y2="191" />
              <line x1="1156" y1="172" x2="1189" y2="191" />
            </g>
          </g>
        </motion.g>

        {/* The village on the middle hill. */}
        <motion.g style={{ y: midY }}>
          <path d="M0 336 C220 296 420 316 600 306 C820 294 1000 274 1200 292 L1200 420 L0 420 Z" fill={p.mid} />

          {/* Trees */}
          <rect x="606" y="268" width="8" height="34" fill="#6B4A2E" />
          <circle cx="610" cy="256" r="26" fill={p.near} />
          <circle cx="600" cy="248" r="8" fill={p.mid} opacity="0.5" />
          <rect x="634" y="276" width="6" height="24" fill="#6B4A2E" />
          <circle cx="637" cy="268" r="17" fill={p.near} />

          <EcoHomes night={night} glass={glass} leaf={leaf} turf={turf} />
          <SolarArray panel={p.panel} night={night} />
        </motion.g>

        {/* Garden rows in the front field. */}
        <path d="M0 372 C300 346 600 380 900 356 C1050 346 1150 360 1200 364 L1200 420 L0 420 Z" fill={p.front} />
        <g stroke={p.line} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M700 384 C760 374 840 374 900 368" />
          <path d="M690 396 C760 386 850 386 920 380" />
        </g>

        {/* Botanical line work in the corners: ferns and seed heads. */}
        <g stroke={night ? '#5E9467' : '#1E3328'} strokeOpacity={night ? 0.8 : 0.55} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M40 400 C44 370 56 346 78 326" />
          <path d="M46 378 C38 372 30 372 24 376 M50 364 C42 356 34 356 28 360 M58 350 C52 340 44 338 38 340 M66 340 C62 330 56 326 50 326" />
          <path d="M46 378 C54 374 62 376 66 382 M52 364 C60 358 68 360 72 366 M60 350 C68 344 76 346 80 352" />
          <path d="M110 400 C112 380 118 364 126 350" />
          <circle cx="127" cy="345" r="5" />
          <path d="M150 400 C150 384 154 372 160 362" />
          <circle cx="161" cy="357" r="4" />
          <path d="M1180 400 C1176 372 1164 352 1146 338" />
          <path d="M1174 378 C1182 372 1190 372 1196 376 M1168 362 C1176 354 1184 354 1190 358 M1158 348 C1164 340 1172 338 1178 340" />
        </g>
      </svg>
    </section>
  );
}
