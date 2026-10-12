'use client';

import { crescentPath, PALETTES, useSkyPhase } from './HeroSky';

/**
 * A short band of the home page's sky and hills for the top of inner pages,
 * so the time-of-day world carries through the whole site.
 */
export function PageSky() {
  const phase = useSkyPhase();
  const ready = phase !== null;
  const p = PALETTES[phase ?? 'day'];
  const night = phase === 'night';
  const sun = { x: 1080, y: night ? 46 : 56 };
  return (
    // Plain paper until the sky is known, then the band fades in (no day-to-night flash in dark mode).
    <div aria-hidden="true" className="relative h-[72px] overflow-hidden sm:h-[96px]" style={{ background: ready ? `linear-gradient(${p.sky}, ${p.sky2})` : 'var(--paper)' }}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="xMaxYMax slice"
        className="absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ opacity: ready ? 1 : 0 }}
      >
        {night && (
          <g fill="#F6F1E4" opacity="0.85">
            {[[820, 24], [900, 50], [960, 18], [1150, 28], [700, 40], [600, 20], [480, 36], [300, 22], [140, 30]].map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 2 : 1.3} />
            ))}
          </g>
        )}
        {night ? (
          <path d={crescentPath(sun.x, sun.y, 20, 9, -5, 18)} fill={p.sun} />
        ) : (
          <g fill={p.sun}>
            {Array.from({ length: 12 }, (_, k) => (
              <ellipse key={k} cx={sun.x} cy={sun.y - 36} rx="3.5" ry="7" transform={`rotate(${k * 30} ${sun.x} ${sun.y})`} opacity="0.9" />
            ))}
            <circle cx={sun.x} cy={sun.y} r="26" />
          </g>
        )}
        <path d="M0 92 C200 62 380 78 560 84 C760 92 930 64 1200 74 L1200 130 L0 130 Z" fill={p.far} />
        <path d="M0 108 C220 88 420 100 640 102 C860 104 1000 90 1200 98 L1200 130 L0 130 Z" fill={p.mid} />
        <path d="M0 120 C300 108 600 122 900 112 C1050 108 1150 114 1200 116 L1200 130 L0 130 Z" fill={p.front} />
        {/* A fern and two seed heads, as on the home page. */}
        <g stroke={night ? '#5E9467' : '#1E3328'} strokeOpacity={night ? 0.8 : 0.5} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M1150 120 C1146 104 1138 94 1126 86" />
          <path d="M1146 108 C1153 104 1160 104 1165 107 M1140 98 C1146 92 1153 92 1158 95 M1133 91 C1137 85 1143 84 1148 86" />
          <path d="M60 120 C61 108 64 100 68 94" />
          <circle cx="69" cy="90" r="3.5" />
          <path d="M84 120 C84 112 86 106 89 101" />
          <circle cx="90" cy="98" r="3" />
        </g>
      </svg>
    </div>
  );
}
