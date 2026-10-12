import type { DailyGame } from './progress';

/**
 * One way of saying how today's game went, used everywhere it appears
 * (home hero pill, home card, header pill, game page), so a finished day always reads the same.
 */
export function dayStatus(game: DailyGame | undefined): { short: string; line: string; spoken: string } | null {
  if (!game?.done) return null;
  const tries = game.history.length;
  if (game.won) {
    return { short: 'Solved', line: `Today: solved on try ${tries}`, spoken: `Today’s grid solved on try ${tries}` };
  }
  const lit = game.history[tries - 1]?.filter(Boolean).length ?? 0;
  return { short: `${lit}/24`, line: `Today: ${lit}/24 lit`, spoken: `Today: ${lit} of 24 hours lit` };
}
