import { ITEMS, MOTORINI } from './items';
import { GameState, Genere, Gusto, Materia, Outcome, Partner, Persona, Preferenza, Rng, StatKey } from './types';

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
    version: 3,
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
    rifiuti: [],
    lavoro: null,
    richiestaSoldiDay: -99,
    pendingEventId: null,
    log: [{ day: 1, text: 'Primo giorno di scuola. È il tuo anno, giargia.' }],
    finito: false,
  };
}

/** Porta un salvataggio vecchio alla versione attuale, o ritorna null se non è valido. */
export function migrate(raw: unknown): GameState | null {
  let s = raw as any;
  if (!s || typeof s !== 'object' || ![1, 2, 3].includes(s.version)) return null;
  if (s.version === 1) {
    s = {
      ...s,
      version: 2,
      genere: 'm',
      voti: votiIniziali(),
      lavoro: null,
      motorino: s.motorino ? { ...s.motorino, benzina: s.motorino.benzina ?? 100 } : null,
    };
  }
  if (s.version === 2) {
    const p = s.partner as { nome: string; affetto: number; giorni: number } | null;
    const genere: Genere = NOMI_RAGAZZI.includes(p?.nome ?? '') ? 'm' : 'f';
    s = {
      ...s,
      version: 3,
      rifiuti: [],
      partner: p
        ? { ...p, genere, emoji: AVATAR[genere][0], figo: 40, gusto: 'romantico', fatto: {}, presentato: false }
        : null,
    };
  }
  return s as GameState;
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

/** Figosità totale: base + vestiti + motorino + partner. */
export function figosita(s: GameState): number {
  return clamp(s.figo + itemsBonus(s) + motorinoBonus(s) + partnerBonus(s));
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

const AVATAR: Record<Genere, string[]> = {
  f: ['👩', '👱‍♀️', '👩‍🦰', '👩‍🦱', '👧', '👩‍🦳'],
  m: ['👨', '👱‍♂️', '👨‍🦰', '👨‍🦱', '👦', '🧔'],
};

export const GUSTI: Record<Gusto, { emoji: string; label: string; descrizione: string }> = {
  romantico: { emoji: '🌹', label: 'Romantic', descrizione: 'Va matta per i regali e il cinema' },
  festaiolo: { emoji: '🪩', label: 'Festaiol', descrizione: 'Vuole uscire: pizza, disco, compagnia' },
  chiacchierone: { emoji: '💬', label: 'Chiacchieron', descrizione: 'Vive di messaggi e vocali' },
  motori: { emoji: '🛵', label: 'Motori', descrizione: 'Il giro in motorino è tutto' },
};

/** Il gusto declinato per la persona: “Romantica”, “Festaiolo”… */
export function gustoLabel(p: Persona): string {
  const l = GUSTI[p.gusto].label;
  return p.gusto === 'motori' ? l : l + (p.genere === 'f' ? 'a' : 'o');
}

/** Forma maschile o femminile per il partner. */
export function gp(p: Persona, m: string, f: string): string {
  return p.genere === 'f' ? f : m;
}

/** “la tipa” o “il tipo”, a seconda di chi ti piace. */
export function nomeRuolo(pref: Preferenza): string {
  return pref === 'ragazze' ? 'Tipa' : pref === 'ragazzi' ? 'Tipo' : 'Amore';
}

function generePer(pref: Preferenza, rng: Rng): Genere {
  if (pref === 'ragazze') return 'f';
  if (pref === 'ragazzi') return 'm';
  return rng() < 0.5 ? 'f' : 'm';
}

export function creaPersona(pref: Preferenza, rng: Rng, figo = 20 + Math.floor(rng() * 70)): Persona {
  const genere = generePer(pref, rng);
  return {
    nome: pick(genere === 'f' ? NOMI_RAGAZZE : NOMI_RAGAZZI, rng),
    genere,
    emoji: pick(AVATAR[genere], rng),
    figo,
    gusto: pick(Object.keys(GUSTI) as Gusto[], rng),
  };
}

export function nuovoPartner(p: Persona, affetto: number): Partner {
  return { ...p, affetto, giorni: 0, fatto: {}, presentato: false };
}

/** Generatore deterministico: le persone in giro restano le stesse per tutta la settimana. */
function seededRng(seed: number): Rng {
  let x = seed >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function settimana(day: number): number {
  return Math.floor((day - 1) / 7);
}

export function candidati(s: GameState): Persona[] {
  const prefSeed = { ragazze: 1, ragazzi: 2, tutti: 3 }[s.preferenza];
  const rng = seededRng(settimana(s.day) * 7919 + prefSeed * 104729 + s.nome.length);
  const fasce = [25, 45, 65, 85];
  const out: Persona[] = [];
  for (const base of fasce) {
    let p = creaPersona(s.preferenza, rng, base + Math.floor(rng() * 12) - 6);
    // Niente omonimi nella stessa settimana.
    for (let i = 0; i < 5 && out.some((o) => o.nome === p.nome); i++) p = creaPersona(s.preferenza, rng, p.figo);
    out.push(p);
  }
  return out;
}

export function chiaveRifiuto(s: GameState, p: Persona): string {
  return `${settimana(s.day)}:${p.nome}`;
}

/** Ti va bene se sei almeno figo quanto lei; se hai quello che le piace, è più facile. */
export function chanceConquista(s: GameState, p: Persona): number {
  let c = 0.45 + (figosita(s) - p.figo) / 80;
  if (p.gusto === 'motori' && motorinoFunziona(s)) c += 0.15;
  if (p.gusto === 'chiacchierone' && hasTelefono(s)) c += 0.1;
  return Math.max(0.05, Math.min(0.9, c));
}

export function difficolta(c: number): { label: string; color: string } {
  if (c >= 0.7) return { label: 'Facile', color: '#D8F5E3' };
  if (c >= 0.45) return { label: 'Ci puoi stare', color: '#FFF0C2' };
  if (c >= 0.2) return { label: 'Difficile', color: '#FFE3C2' };
  return { label: 'Fuori portata', color: '#FFE0E3' };
}

/** Un partner molto figo ti dà prestigio. */
export function partnerBonus(s: GameState): number {
  return s.partner ? Math.round(s.partner.figo / 10) : 0;
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}
