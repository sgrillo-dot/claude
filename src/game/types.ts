export type Preferenza = 'ragazze' | 'ragazzi' | 'tutti';

export type Genere = 'm' | 'f';

export type StatKey = 'soldi' | 'figo' | 'studio' | 'energia' | 'genitori';

export type Materia = 'italiano' | 'matematica' | 'inglese' | 'storia' | 'scienze' | 'ginnastica';

export type Rng = () => number;

export interface Partner {
  nome: string;
  affetto: number;
  giorni: number;
}

export interface Motorino {
  id: string;
  condizione: number;
  truccato: boolean;
  benzina: number;
}

export interface Lavoro {
  id: string;
  /** Ultimo giorno in cui hai fatto un turno. */
  ultimoTurno: number;
}

export interface LogEntry {
  day: number;
  text: string;
}

export interface GameState {
  version: 2;
  nome: string;
  genere: Genere;
  preferenza: Preferenza;
  /** Giorno di gioco, parte da 1 (lunedì 14 settembre). */
  day: number;
  soldi: number;
  /** Figosità di base, a cui si sommano vestiti e motorino. */
  figo: number;
  /** Preparazione generale: conta per interrogazioni e pagella. */
  studio: number;
  energia: number;
  /** Quanto i genitori sono contenti di te. */
  genitori: number;
  voti: Record<Materia, number>;
  /** Se oggi hai già deciso cosa fare con la scuola. */
  scuolaOggi: boolean;
  assenze: number;
  inventario: string[];
  motorino: Motorino | null;
  partner: Partner | null;
  exPartners: number;
  lavoro: Lavoro | null;
  /** Ultimo giorno in cui hai chiesto soldi extra ai genitori. */
  richiestaSoldiDay: number;
  pendingEventId: string | null;
  log: LogEntry[];
  finito: boolean;
}

export interface Outcome {
  state: GameState;
  messages: string[];
}

export type ItemCategory = 'vestiti' | 'accessori' | 'telefoni' | 'motorini' | 'bar';

export interface Item {
  id: string;
  nome: string;
  emoji: string;
  categoria: ItemCategory;
  prezzo: number;
  /** Bonus permanente alla figosità finché lo possiedi. */
  figo: number;
  descrizione: string;
  /** Gli oggetti del bar si consumano subito. */
  consumabile?: Partial<Record<StatKey, number>>;
}

export type ActionTab = 'scuola' | 'uscite' | 'lavoro';

export interface Action {
  id: string;
  tab: ActionTab;
  emoji: string;
  titolo: string;
  descrizione: string;
  energia: number;
  soldi: number;
  /** Ritorna il motivo per cui non si può fare, oppure null. */
  bloccata?: (s: GameState) => string | null;
  esegui: (s: GameState, rng: Rng) => Outcome;
}

export interface EventChoice {
  label: string | ((s: GameState) => string);
  esito: (s: GameState, rng: Rng) => Outcome;
}

export interface GameEvent {
  id: string;
  emoji: string;
  titolo: string;
  testo: (s: GameState) => string;
  peso: number;
  condizione?: (s: GameState) => boolean;
  /** Azioni o schede dopo cui l'evento può capitare anche di giorno. */
  dopo?: string[];
  /** Se vero capita solo di giorno, mai di notte. */
  soloGiorno?: boolean;
  scelte: EventChoice[];
}
