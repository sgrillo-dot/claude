import { ITEMS, MOTORINI } from './items';
import { GameState, Genere, Materia, Outcome, Preferenza, Rng, StatKey } from './types';

export const MAX_LOG = 30;

export const MATERIE: { id: Materia; nome: string; emoji: string }[] = [
  { id: 'italiano', nome: 'Italiano', emoji: '📜' },
  { id: 'matematica', nome: 'Matematica', emoji: '➗' },
  { id: 'inglese', nome: 'Inglese', emoji: '🇬🇧' },
  { id: 'storia', nome: 'Storia', emoji: '🏛️' },
  { id: 'scienze', nome: 'Scienze', emoji: '🧪' },
  { id: 'ginnastica', nome: 'Ginnastica', emoji: '🏀' },
];

const NOMI_RAGAZZE = ['Giada', 'Martina', 'Aurora', 'Nicole', 'Asia', 'Chiara', 'Ludovica', 'Sofia', 'Jessica', 'Alice'];
const NOMI_RAGAZZI = ['Kevin', 'Mattia', 'Christian', 'Gabriel', 'Nicolò', 'Thomas', 'Diego', 'Samuele', 'Manuel', 'Ivan'];

const votiIniziali = (): Record<Materia, number> => ({
  italiano: 6,
  matematica: 6,
  inglese: 6,
  storia: 6,
  scienze: 6,
  ginnastica: 6,
});

export function newGame(nome: string, genere: Genere, preferenza: Preferenza): GameState {
  return {
    version: 2,
    nome: nome.trim() || 'Giargia',
    genere,
    preferenza,
    day: 1,
    soldi: 50,
    figo: 10,
    studio: 40,
    energia: 100,
    genitori: 60,
    voti: votiIniziali(),
    scuolaOggi: false,
    assenze: 0,
    inventario: [],
    motorino: null,
    partner: null,
    exPartners: 0,
    lavoro: null,
    richiestaSoldiDay: -99,
    pendingEventId: null,
    log: [{ day: 1, text: 'Primo giorno di scuola. È il tuo anno, giargia.' }],
    finito: false,
  };
}

/** Porta un salvataggio vecchio alla versione attuale, o ritorna null se non è valido. */
export function migrate(raw: unknown): GameState | null {
  const s = raw as Record<string, unknown> | null;
  if (!s || typeof s !== 'object') return null;
  if (s.version === 2) return s as unknown as GameState;
  if (s.version === 1) {
    const old = s as unknown as Omit<GameState, 'version' | 'genere' | 'voti' | 'lavoro'>;
    return {
      ...old,
      version: 2,
      genere: 'm',
      voti: votiIniziali(),
      lavoro: null,
      motorino: old.motorino ? { ...old.motorino, benzina: old.motorino.benzina ?? 100 } : null,
    };
  }
  return null;
}

/** Sceglie la forma maschile o femminile di una parola. */
export function g(s: GameState, m: string, f: string): string {
  return s.genere === 'f' ? f : m;
}

/** Desinenza o/a per gli aggettivi: `stanc${o(s)}`. */
export function o(s: GameState): string {
  return s.genere === 'f' ? 'a' : 'o';
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

export function setVoto(s: GameState, materia: Materia, voto: number): GameState {
  return { ...s, voti: { ...s.voti, [materia]: clamp(voto, 1, 10) } };
}

/** Il voto nuovo fa media con quello vecchio, come sul registro. */
export function registraVoto(s: GameState, materia: Materia, voto: number): GameState {
  return setVoto(s, materia, Math.round((s.voti[materia] + voto) / 2));
}

/** Voto che prenderesti oggi, in base a quanto hai studiato. */
export function votoInterrogazione(s: GameState, rng: Rng): number {
  return clamp(Math.round(2 + s.studio / 12 + rng() * 3 - 1), 1, 10);
}

/** La materia di oggi è fissa per giorno, così l'evento resta coerente dopo un salvataggio. */
export function materiaDelGiorno(day: number): (typeof MATERIE)[number] {
  return MATERIE[(day * 7) % MATERIE.length];
}

export function addLog(s: GameState, text: string): GameState {
  return { ...s, log: [{ day: s.day, text }, ...s.log].slice(0, MAX_LOG) };
}

/** Esito standard: applica il delta e registra il messaggio nel diario. */
export function outcome(s: GameState, text: string, delta: Partial<Record<StatKey, number>> = {}): Outcome {
  return { state: addLog(applyDelta(s, delta), text), messages: [text] };
}

export function motorinoFunziona(s: GameState): boolean {
  return !!s.motorino && s.motorino.condizione > 0 && s.motorino.benzina > 0;
}

export function motorinoBonus(s: GameState): number {
  if (!s.motorino || !motorinoFunziona(s)) return 0;
  const def = MOTORINI[s.motorino.id];
  return (def?.figo ?? 0) + (s.motorino.truccato ? 5 : 0);
}

export function itemsBonus(s: GameState): number {
  return s.inventario.reduce((sum, id) => sum + (ITEMS[id]?.figo ?? 0), 0);
}

export function hasTelefono(s: GameState): boolean {
  return s.inventario.some((id) => ITEMS[id]?.categoria === 'telefoni');
}

export function hasSmartphone(s: GameState): boolean {
  return s.inventario.includes('smartphone');
}

/** Figosità totale: base + vestiti + motorino. */
export function figosita(s: GameState): number {
  return clamp(s.figo + itemsBonus(s) + motorinoBonus(s));
}

export function titoloGiargia(s: GameState): string {
  const f = figosita(s);
  if (f < 20) return g(s, 'Sfigato cosmico', 'Sfigata cosmica');
  if (f < 40) return 'Giargia in prova';
  if (f < 60) return 'Giargia di quartiere';
  if (f < 80) return g(s, 'Re della piazzetta', 'Regina della piazzetta');
  return `Giargia leggendari${o(s)}`;
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
