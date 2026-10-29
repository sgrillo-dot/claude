const START = Date.UTC(2026, 8, 14); // lunedì 14 settembre 2026
const END = Date.UTC(2027, 5, 6); // domenica 6 giugno 2027
const DAY_MS = 24 * 60 * 60 * 1000;

export const LAST_DAY = Math.round((END - START) / DAY_MS) + 1;

/** Giorno di gioco corrispondente a una data (mese da 1 a 12). */
export function dayOf(year: number, month: number, date: number): number {
  return Math.round((Date.UTC(year, month - 1, date) - START) / DAY_MS) + 1;
}

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export const NATALE = dayOf(2026, 12, 25);
export const BEFANA = dayOf(2027, 1, 6);
export const FINE_QUADRIMESTRE = dayOf(2027, 1, 31);

const VACANZE: { da: number; a: number; nome: string }[] = [
  { da: dayOf(2026, 12, 8), a: dayOf(2026, 12, 8), nome: 'Immacolata' },
  { da: dayOf(2026, 12, 23), a: BEFANA, nome: 'Vacanze di Natale' },
  { da: dayOf(2027, 3, 25), a: dayOf(2027, 3, 30), nome: 'Vacanze di Pasqua' },
  { da: dayOf(2027, 6, 2), a: dayOf(2027, 6, 2), nome: 'Festa della Repubblica' },
];

/** Nome della festa o delle vacanze in corso, se oggi non c'è scuola per quello. */
export function festa(day: number): string | null {
  return VACANZE.find((v) => day >= v.da && day <= v.a)?.nome ?? null;
}

/** 0 = lunedì, 6 = domenica. */
export function dayOfWeek(day: number): number {
  return (day - 1) % 7;
}

export function isWeekend(day: number): boolean {
  return dayOfWeek(day) >= 5;
}

export function isSchoolDay(day: number): boolean {
  return !isWeekend(day) && !festa(day);
}

/** Venerdì e sabato sera la disco è aperta. */
export function isDiscoNight(day: number): boolean {
  const d = dayOfWeek(day);
  return d === 4 || d === 5;
}

export function formatDay(day: number): string {
  const date = new Date(START + (day - 1) * DAY_MS);
  return `${GIORNI[dayOfWeek(day)]} ${date.getUTCDate()} ${MESI[date.getUTCMonth()]}`;
}
