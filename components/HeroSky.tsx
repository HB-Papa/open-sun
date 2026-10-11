'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

type Phase = 'dawn' | 'day' | 'dusk' | 'night';

const PALETTES: Record<Phase, { sky: string; sky2: string; sun: string; far: string; mid: string; near: string; front: string; panel: string }> = {
  dawn: { sky: '#F6D9B8', sky2: '#F3E3B5', sun: '#EFA04A', far: '#B8C996', mid: '#6E9C6E', near: '#3E7C4F', front: '#2F6B45', panel: '#2A7C86' },
  day: { sky: '#F3E3B5', sky2: '#F6ECCB', sun: '#E3A72F', far: '#A9C48E', mid: '#5E9467', near: '#2F6B45', front: '#2F6B45', panel: '#1F6F78' },
  dusk: { sky: '#EBC0A0', sky2: '#D99A86', sun: '#D9773F', far: '#94A980', mid: '#557E5B', near: '#2F5E40', front: '#2A5639', panel: '#245E66' },
  night: { sky: '#1B2D3A', sky2: '#243B47', sun: '#F1E6C2', far: '#2E4A3B', mid: '#22392D', near: '#1A2E23', front: '#14251B', panel: '#1E4C55' },
};

function phaseFor(h: number): Phase {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

/** The home page header: sky and light follow the visitor's local time; hills drift on scroll. */
export function HeroSky() {
  const [phase, setPhase] = useState<Phase>('day');
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const sunY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 60]);
  const farY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 24]);
  const midY = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 12]);

  useEffect(() => {
    const tick = () => setPhase(phaseFor(new Date().getHours()));
    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const p = PALETTES[phase];
  const night = phase === 'night';
  const sunX = phase === 'dawn' ? 260 : phase === 'dusk' ? 1000 : 930;
  const sunCy = phase === 'day' ? 120 : 175;

  return (
    <svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" className="block h-[420px] w-full sm:h-[360px]" aria-hidden="true">
      <defs>
        <linearGradient id="skyfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky} />
          <stop offset="1" stopColor={p.sky2} />
        </linearGradient>
      </defs>
      <rect width="1200" height="360" fill="url(#skyfill)" style={{ transition: 'fill 1s' }} />
      {night && (
        <g fill="#F6F1E4">
          {[
            [80, 40], [190, 90], [320, 30], [450, 70], [560, 25], [700, 60], [820, 35], [1080, 80], [1150, 30], [640, 110], [380, 120], [990, 140],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 2.2 : 1.4} opacity={0.85} />
          ))}
        </g>
      )}
      <motion.g style={{ y: sunY }}>
        {/* A stained-glass sun: rays as soft petals around the disc. */}
        {!night && (
          <g stroke={p.sun} strokeWidth="5" strokeLinecap="round" opacity="0.9">
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k / 12) * Math.PI * 2;
              // Rounded so server and browser render identical numbers.
              const at = (r: number, f: (x: number) => number, c: number) => Math.round((c + f(a) * r) * 10) / 10;
              return (
                <line
                  key={k}
                  x1={at(88, Math.cos, sunX)}
                  y1={at(88, Math.sin, sunCy)}
                  x2={at(104, Math.cos, sunX)}
                  y2={at(104, Math.sin, sunCy)}
                />
              );
            })}
          </g>
        )}
        <circle cx={sunX} cy={sunCy} r={night ? 46 : 72} fill={p.sun} />
        {night && <circle cx={sunX + 18} cy={sunCy - 10} r={42} fill={p.sky} />}
      </motion.g>
      <motion.path style={{ y: farY }} d="M0 250 C200 170 380 200 560 230 C760 262 920 190 1200 220 L1200 380 L0 380 Z" fill={p.far} />
      <motion.g style={{ y: midY }}>
        <path d="M0 290 C240 230 420 270 640 280 C860 290 1000 250 1200 270 L1200 380 L0 380 Z" fill={p.mid} />
        {/* Solar panels softened by vines. */}
        <g fill={p.panel} stroke="#FFFDF7" strokeWidth="2">
          <path d="M600 258 l60 -14 l14 20 l-60 14 Z" />
          <path d="M684 240 l60 -14 l14 20 l-60 14 Z" />
          <path d="M768 222 l60 -14 l14 20 l-60 14 Z" />
        </g>
        <path d="M596 280 C620 270 640 286 664 276 S700 262 720 268 S770 250 800 254" stroke="#A9C48E" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Homes with windows that glow gold after dark. */}
        <g>
          <path d="M440 262 l24 -18 l24 18 v22 h-48 Z" fill="#F3E3B5" stroke="#1E3328" strokeWidth="2" />
          <rect x="458" y="266" width="12" height="18" fill={night || phase === 'dusk' ? '#E3A72F' : '#CFC4A6'} />
          <path d="M500 270 l20 -15 l20 15 v18 h-40 Z" fill="#EAD9C9" stroke="#1E3328" strokeWidth="2" />
          <rect x="514" y="274" width="10" height="14" fill={night || phase === 'dusk' ? '#E3A72F' : '#CFC4A6'} />
        </g>
        <g>
          <rect x="250" y="226" width="10" height="44" fill="#6B4A2E" />
          <circle cx="255" cy="212" r="34" fill={p.near} />
          <rect x="330" y="240" width="8" height="34" fill="#6B4A2E" />
          <circle cx="334" cy="228" r="24" fill={p.mid === '#22392D' ? '#2E4A3B' : '#3E7C4F'} />
        </g>
      </motion.g>
      <path d="M0 320 C300 300 600 330 900 315 C1050 308 1150 318 1200 320 L1200 380 L0 380 Z" fill={p.front} />
    </svg>
  );
}
