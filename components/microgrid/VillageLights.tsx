'use client';

import { EcoHomes, PALETTES, SolarArray } from '../HeroSky';

/** Shown after a win: the home page's village at night, its windows lighting one house at a time. */
export function VillageLights() {
  const p = PALETTES.night;
  return (
    <figure className="village-lights on-forest m-0 overflow-hidden rounded-[20px]" style={{ background: `linear-gradient(${p.sky}, ${p.sky2})` }}>
      <svg viewBox="590 196 580 124" className="block h-auto w-full" aria-hidden="true">
        <g fill="#F6F1E4" opacity="0.85">
          {[[640, 214], [720, 206], [960, 214], [1020, 230], [1100, 208], [1150, 236]].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k % 2 ? 1.4 : 2} />
          ))}
        </g>
        <circle cx="1040" cy="222" r="14" fill={p.sun} />
        <circle cx="1047" cy="218" r="12.5" fill={p.sky} />
        <path d="M560 336 C720 300 900 288 1000 280 C1080 276 1140 284 1200 290 L1200 340 L560 340 Z" fill={p.mid} />
        <EcoHomes night glass="#33464F" leaf="#4F7F5A" turf="#2F5A3C" />
        <SolarArray panel={p.panel} night />
      </svg>
      <figcaption className="px-5 pb-4 pt-1 font-serif text-[22px] font-semibold text-on-forest">The village is lit.</figcaption>
    </figure>
  );
}
