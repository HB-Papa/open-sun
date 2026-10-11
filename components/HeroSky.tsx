'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

type Phase = 'dawn' | 'day' | 'dusk' | 'night';

type Palette = { sky: string; sky2: string; sun: string; far: string; mid: string; near: string; front: string; panel: string; line: string; text: string; soft: string };

const PALETTES: Record<Phase, Palette> = {
  dawn: { sky: '#F6D9B8', sky2: '#F3E3B5', sun: '#EFA04A', far: '#B8C996', mid: '#7FA877', near: '#3E7C4F', front: '#2F6B45', panel: '#2A7C86', line: '#2F5E40', text: '#1E3328', soft: '#2E3E34' },
  day: { sky: '#F3E3B5', sky2: '#F6ECCB', sun: '#E3A72F', far: '#B5CC98', mid: '#7FA877', near: '#3E7C4F', front: '#2F6B45', panel: '#1F6F78', line: '#2F5E40', text: '#1E3328', soft: '#2E3E34' },
  dusk: { sky: '#EBC0A0', sky2: '#F0D2B4', sun: '#D9773F', far: '#A3B58B', mid: '#6E8E62', near: '#3A6646', front: '#2A5639', panel: '#245E66', line: '#24452F', text: '#1E3328', soft: '#2E3E34' },
  night: { sky: '#1B2D3A', sky2: '#22394A', sun: '#F1E6C2', far: '#2E4A3B', mid: '#26402F', near: '#1D3326', front: '#14251B', panel: '#1E4C55', line: '#3E5F4B', text: '#F6F1E4', soft: '#DCE6D8' },
};

function phaseFor(h: number): Phase {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The home page header: a small solarpunk village whose sky follows the visitor's
 * local time (and stays at night in dark mode). The headline sits on open sky.
 */
export function Hero() {
  const [phase, setPhase] = useState<Phase>('day');
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const sunY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 50]);
  const farY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 20]);
  const midY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 10]);

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

  const p = PALETTES[phase];
  const night = phase === 'night';
  const lit = night || phase === 'dusk';
  const sun = phase === 'dawn' ? { x: 990, y: 190 } : phase === 'dusk' ? { x: 1000, y: 196 } : phase === 'night' ? { x: 980, y: 96 } : { x: 975, y: 110 };
  const windows = lit ? '#E3A72F' : '#CFC4A6';

  return (
    <section className="relative overflow-hidden md:min-h-[520px]" style={{ background: `linear-gradient(${p.sky}, ${p.sky2})`, transition: 'background 1s' }}>
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pb-6 pt-9 sm:px-6 md:pb-40 md:pt-16">
        <div className="max-w-[540px]" style={{ color: p.text }}>
          <h1 className="mb-4 font-serif text-[40px] font-bold leading-[1.02] tracking-[-0.01em] text-balance sm:text-[56px]">A free library for a brighter tomorrow</h1>
          <p className="mb-6 max-w-[46ch] text-[17px] leading-normal sm:text-[19px]" style={{ color: p.soft }}>
            Open access writing on solarpunk, solar power, living land, and the commons, gathered in one place and updated every week.
          </p>
          <form role="search" action="/library" className="flex flex-wrap gap-2.5">
            <label htmlFor="home-search" className="sr-only">
              Search the library
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Try: community solar, agrivoltaics"
              className="min-h-12 flex-[1_1_220px] rounded-full border-2 border-line-strong bg-input px-4 text-[17px] text-ink shadow-[0_2px_10px_rgba(30,51,40,.08)] placeholder:text-muted"
            />
            <button type="submit" className="min-h-12 rounded-full bg-leaf px-[22px] font-bold text-white">
              Search
            </button>
          </form>
          <p className="mt-4 text-[16px]">
            <Link href="/library/flynn-2014-solarpunk-notes-manifesto" className="font-bold underline decoration-2" style={{ color: p.text }}>
              New to solarpunk? Start with one short essay
            </Link>
          </p>
        </div>
      </div>

      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMaxYMax slice"
        className="block h-[230px] w-full sm:h-[280px] md:absolute md:inset-0 md:h-full"
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

          {/* Homes, with rooftop panels and windows that glow after dark. */}
          <g stroke="#1E3328" strokeWidth="2" strokeLinejoin="round">
            <path d="M660 300 v-30 l30 -24 l30 24 v30 Z" fill="#F3E3B5" />
            <path d="M762 296 v-38 l38 -30 l38 30 v38 Z" fill="#EAD9C9" />
            <path d="M880 290 v-28 l28 -22 l28 22 v28 Z" fill="#F0D6D0" />
          </g>
          <g fill={p.panel} stroke="#FFFDF7" strokeWidth="1.5">
            <path d="M694 250 l20 16 l-8 4 l-20 -16 Z" />
            <path d="M806 230 l26 20 l-9 5 l-26 -20 Z" />
          </g>
          <g fill={windows} style={{ transition: 'fill 1s' }}>
            <rect x="682" y="278" width="14" height="22" />
            <rect x="782" y="270" width="14" height="14" />
            <rect x="806" y="270" width="14" height="14" />
            <rect x="900" y="268" width="14" height="22" />
          </g>

          {/* A row of panels on the slope, softened by a vine. */}
          <g fill={p.panel} stroke="#FFFDF7" strokeWidth="2">
            <path d="M944 286 l46 -11 l11 16 l-46 11 Z" />
            <path d="M1006 274 l46 -11 l11 16 l-46 11 Z" />
            <path d="M1068 262 l46 -11 l11 16 l-46 11 Z" />
          </g>
          <path d="M942 306 C962 296 980 312 1002 300 S1040 288 1062 294 S1100 280 1128 284" stroke={night ? '#5E9467' : '#A9C48E'} strokeWidth="3" fill="none" strokeLinecap="round" />
          {[960, 1004, 1048, 1092].map((x, k) => (
            <path key={x} d={`M${x} ${300 - k * 4} c-2 -8 4 -12 10 -12 c0 7 -4 11 -10 12Z`} fill={night ? '#5E9467' : '#A9C48E'} />
          ))}
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
