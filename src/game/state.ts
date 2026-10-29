import { ITEMS, MOTORINI } from './items';
import { GameState, Outcome, Preferenza, Rng, StatKey } from './types';

export const MAX_LOG = 30;

const NOMI_RAGAZZE = ['Giada', 'Martina', 'Aurora', 'Nicole', 'Asia', 'Chiara', 'Ludovica', 'Sofia', 'Jessica', 'Alice'];
const NOMI_RAGAZZI = ['Kevin', 'Mattia', 'Christian', 'Gabriel', 'Nicolò', 'Thomas', 'Diego', 'Samuele', 'Manuel', 'Ivan'];

export function newGame(nome: string, preferenza: Preferenza): GameState {
  return {
    version: 1,
    nome: nome.trim() || 'Giargia',
    preferenza,
    day: 1,
    soldi: 50,
    figo: 10,
    studio: 40,
    energia: 100,
    genitori: 60,
    scuolaOggi: false,
    assenze: 0,
    inventario: [],
    motorino: null,
    partner: null,
    exPartners: 0,
    richiestaSoldiDay: -99,
    pendingEventId: null,
    log: [{ day: 1, text: 'Primo giorno di scuola. È il tuo anno, giargia.' }],
    finito: false,
  };
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/** Applica variazioni alle statistiche, rispettando i limiti. */
export function applyDelta(s: GameState, delta: Partial<Record<StatKey, number>>): GameState {
  return {
    ...s,
    soldi: Math.max(0, Math.round(s.soldi + (delta.soldi ?? 0))),
    figo: clamp(s.figo + (delta.figo ?? 0)),
    studio: clamp(s.studio + (delta.studio ?? 0)),
    energia: clamp(s.energia + (delta.energia ?? 0)),
    genitori: clamp(s.genitori + (delta.genitori ?? 0)),
  };
}

export function addLog(s: GameState, text: string): GameState {
  return { ...s, log: [{ day: s.day, text }, ...s.log].slice(0, MAX_LOG) };
}

/** Esito standard: applica il delta e registra il messaggio nel diario. */
export function outcome(s: GameState, text: string, delta: Partial<Record<StatKey, number>> = {}): Outcome {
  return { state: addLog(applyDelta(s, delta), text), messages: [text] };
}

export function motorinoBonus(s: GameState): number {
  if (!s.motorino || s.motorino.condizione <= 0) return 0;
  const def = MOTORINI[s.motorino.id];
  return (def?.figo ?? 0) + (s.motorino.truccato ? 5 : 0);
}

export function itemsBonus(s: GameState): number {
  return s.inventario.reduce((sum, id) => sum + (ITEMS[id]?.figo ?? 0), 0);
}

/** Figosità totale: base + vestiti + motorino. */
export function figosita(s: GameState): number {
  return clamp(s.figo + itemsBonus(s) + motorinoBonus(s));
}

export function titoloGiargia(f: number): string {
  if (f < 20) return 'Sfigato cosmico';
  if (f < 40) return 'Giargia in prova';
  if (f < 60) return 'Giargia di quartiere';
  if (f < 80) return 'Boss della piazzetta';
  return 'Giargia leggendario';
}

export function pick<T>(list: readonly T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function randomPartnerName(p: Preferenza, rng: Rng): string {
  if (p === 'ragazze') return pick(NOMI_RAGAZZE, rng);
  if (p === 'ragazzi') return pick(NOMI_RAGAZZI, rng);
  return pick([...NOMI_RAGAZZE, ...NOMI_RAGAZZI], rng);
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}
