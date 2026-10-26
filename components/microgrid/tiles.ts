import type { Part, Terrain } from '@/lib/microgrid';

export const PART_NAME: Record<Part, string> = { solar: 'Solar panel', wind: 'Wind turbine', battery: 'Battery', garden: 'Garden' };
export const TERRAIN_NAME: Record<Terrain, string> = { open: 'Open ground', ridge: 'Windy ridge', home: 'Home', tree: 'Tree', pond: 'Pond', rock: 'Rocky ground' };

// Colors come from CSS tokens so the board dims to a moonlit version in dark mode.
export const PART_BG: Record<Part, string> = { solar: 'var(--g-solar)', wind: 'var(--g-wind)', battery: 'var(--g-battery)', garden: 'var(--g-garden)' };
export const TERRAIN_BG: Record<Terrain, string> = { open: 'var(--g-open)', ridge: 'var(--g-ridge)', home: 'var(--g-home)', tree: 'var(--g-wild)', pond: 'var(--g-wild)', rock: 'var(--g-rock)' };

/** The light over the board for one hour of a run: night blue, warm low sun, grey cloud, or a faint noon gold. */
export function washFor(sky: string | null, sun: number): string {
  if (sky === 'night') return 'rgb(16 30 54 / 0.5)';
  if (sky === 'cloudy') return 'rgb(96 112 124 / 0.22)';
  if (sun < 0.3) return 'rgb(222 128 60 / 0.2)';
  return 'rgb(255 226 140 / 0.1)';
}
