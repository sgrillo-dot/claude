import { statDeltas } from '../game/engine';
import { GameState } from '../game/types';

export type SoundName = 'tap' | 'coin' | 'good' | 'bad' | 'error' | 'night' | 'event' | 'love' | 'fanfare' | 'scooter';

/** Sceglie il suono giusto confrontando lo stato prima e dopo una mossa. */
export function soundFor(prev: GameState, next: GameState): SoundName {
  if (next === prev) return 'error';
  if (!prev.partner && next.partner) return 'love';
  const m = next.motorino;
  if (m && (prev.motorino?.id !== m.id || m.benzina > (prev.motorino?.benzina ?? 0))) return 'scooter';
  if (next.inventario.length > prev.inventario.length) return 'coin';
  // L'energia spesa e i soldi pagati sono il costo della mossa, non il suo esito.
  const score = statDeltas(prev, next)
    .filter((d) => d.key !== 'energia' && !(d.key === 'soldi' && d.value < 0))
    .reduce((sum, d) => sum + Math.sign(d.value), 0);
  if (next.soldi > prev.soldi && score >= 0) return 'coin';
  return score < 0 ? 'bad' : 'good';
}
