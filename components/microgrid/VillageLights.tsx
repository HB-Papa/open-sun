'use client';

import Link from 'next/link';
import { crescentPath, EcoHomes, PALETTES, SolarArray } from '../HeroSky';

// After a short day, one reading that matches what went wrong, rather than a search.
const READING = {
  night: {
    why: 'Storage is usually what carries a village through the night.',
    href: '/field-guide#battery-storage',
    label: 'Read about battery storage',
  },
  day: {
    why: 'Daytime gaps usually mean too few panels, or panels in the shade. Gardens help keep them cool.',
    href: '/library/barron-gafford-2019-agrivoltaics',
    label: 'Read how plants and panels help each other',
  },
};

/**
 * The end of the day, in the home page's village at night.
 * After a win the windows light one house at a time; after a loss most stay dark,
 * with a reading that helps for tomorrow.
 */
export function VillageLights({ dim = false, shortfall = 'night' }: { dim?: boolean; shortfall?: 'night' | 'day' }) {
  const p = PALETTES.night;
  const reading = READING[shortfall];
  return (
    <figure className={`village-lights on-forest m-0 overflow-hidden rounded-[20px] ${dim ? 'is-dim' : ''}`} style={{ background: `linear-gradient(${p.sky}, ${p.sky2})` }}>
      <svg viewBox="590 196 580 124" className="block h-auto w-full" aria-hidden="true">
        <g fill="#F6F1E4" opacity="0.85">
          {[[640, 214], [720, 206], [960, 214], [1020, 230], [1100, 208], [1150, 236]].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k % 2 ? 1.4 : 2} />
          ))}
        </g>
        <path d={crescentPath(1040, 222, 14, 7, -4, 12.5)} fill={p.sun} />
        <path d="M560 336 C720 300 900 288 1000 280 C1080 276 1140 284 1200 290 L1200 340 L560 340 Z" fill={p.mid} />
        <EcoHomes night glass="#33464F" leaf="#4F7F5A" turf="#2F5A3C" />
        <SolarArray panel={p.panel} night />
      </svg>
      <figcaption className="flex flex-col gap-1 px-5 pb-4 pt-1">
        <span className="font-serif text-heading font-semibold text-on-forest">{dim ? 'Some homes went dark tonight.' : 'The village is lit.'}</span>
        {dim && (
          <span className="text-copy text-on-forest-muted">
            {reading.why}{' '}
            <Link href={reading.href} className="font-bold text-on-forest-gold underline hover:text-sun">
              {reading.label}
            </Link>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
