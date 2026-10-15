// Small inline SVG icons. All are decorative (aria-hidden); text labels carry meaning.

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="8" fill="#E3A72F" />
      <g stroke="#E3A72F" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="2" x2="18" y2="6" />
        <line x1="18" y1="30" x2="18" y2="34" />
        <line x1="2" y1="18" x2="6" y2="18" />
        <line x1="30" y1="18" x2="34" y2="18" />
        <line x1="6.7" y1="6.7" x2="9.5" y2="9.5" />
        <line x1="26.5" y1="26.5" x2="29.3" y2="29.3" />
        <line x1="6.7" y1="29.3" x2="9.5" y2="26.5" />
        <line x1="26.5" y1="9.5" x2="29.3" y2="6.7" />
      </g>
      <path d="M12 22c3-4 9-4 12 0" stroke="#2F6B45" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function LeafSprout() {
  return (
    <svg className="leaf" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M3 23 C6 12 13 5 23 3 C22 13 15 21 3 23Z" fill="#5E9467" />
      <path d="M3 23 C9 17 14 11 20 6" stroke="#2F6B45" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 3h7v7M13 3 4 12" />
    </svg>
  );
}

export function SolarIcon({ stroke = '#FFFDF7', tilt = false }: { stroke?: string; tilt?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.6"
      aria-hidden="true"
      className="h-[64%] w-[64%] transition-transform duration-700"
      style={tilt ? { transform: 'perspective(40px) rotateX(18deg)' } : undefined}
    >
      <path d="M3 17 7 7h14l-4 10Z" />
      <path d="M10 7 8 17M14 7l-2 10M5 12h14" />
    </svg>
  );
}

export function WindIcon({ stroke = '#1E3328', spin = false }: { stroke?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="h-[64%] w-[64%]">
      <path d="M12 12v9" />
      <g className={spin ? 'turbine-spin' : undefined}>
        <path d="M12 12 12 3" />
        <path d="M12 12 4.5 16" />
        <path d="M12 12l7.5 4" />
      </g>
      <circle cx="12" cy="12" r="1.5" fill={stroke} />
    </svg>
  );
}

export function BatteryIcon({ stroke = '#FFFDF7', level = -1 }: { stroke?: string; level?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true" className="h-[60%] w-[60%]">
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <path d="M10 3h4" />
      {level >= 0 ? (
        <rect x="8" y={19 - 12 * level} width="8" height={12 * level} fill="#E3A72F" stroke="none" />
      ) : (
        <path d="M12 9l-2 4h4l-2 4" />
      )}
    </svg>
  );
}

export function GardenIcon({ stroke = '#1E3328' }: { stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" className="h-[62%] w-[62%]">
      <path d="M12 21v-8" />
      <path d="M12 15c-4 0-6-3-6-6 3 0 6 2 6 6Z" fill="#A9C48E" />
      <path d="M12 13c0-4 3-6 6-6 0 3-2 6-6 6Z" fill="#5E9467" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function HomeIcon({ lit, stroke = '#1E3328' }: { lit: boolean | null; stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true" className="h-[62%] w-[62%]">
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
      <rect x="10" y="14" width="4" height="6" className={lit ? 'window-lit' : undefined} fill={lit ? '#E3A72F' : lit === false ? '#4A5A50' : 'none'} />
    </svg>
  );
}

export function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[70%] w-[70%]">
      <rect x="11" y="14" width="2.5" height="8" fill="#6B4A2E" />
      <circle cx="12" cy="10" r="7" fill="#2F6B45" />
      <circle cx="9" cy="8" r="2.2" fill="#3E7C4F" />
    </svg>
  );
}

/** Rocky ground: a cluster of stones. Nothing can be built here. */
export function RockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[70%] w-[70%]">
      <path d="M3 18c0-4 3-7 6-7 2 0 3 1 4 2 1-2 3-3 5-2 2 1 3 4 3 7Z" fill="var(--rock-dark)" />
      <path d="M6 18c0-2.5 1.6-4.5 3.6-4.5S13 15.5 13 18Z" fill="var(--rock-light)" />
      <path d="M14 18c.2-2 1.4-3.4 3-3.4s2.8 1.4 3 3.4Z" fill="var(--rock-light)" />
      <path d="M2 18.5h20" stroke="var(--rock-dark)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function PondIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[70%] w-[70%]">
      <ellipse cx="12" cy="13" rx="9" ry="6" fill="#4F97A0" />
      <path d="M7 12c1.5-1 3-1 4.5 0M12.5 15c1.5-1 3-1 4.5 0" stroke="#CDE4E6" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function RidgeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute bottom-0.5 left-0.5 h-[34%] w-[34%] opacity-80">
      <path d="M2 20 9 9l4 6 3-4 6 9Z" fill="#7C9A6A" stroke="#4E6B43" strokeWidth="1" />
    </svg>
  );
}

export function SunGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="4" fill="#E3A72F" />
    </svg>
  );
}

export function MoonGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M10.5 2.5a5.5 5.5 0 1 0 3 9.5 4.5 4.5 0 0 1-3-9.5Z" fill="#9FB3B5" />
    </svg>
  );
}
