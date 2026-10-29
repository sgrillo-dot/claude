const START = Date.UTC(2026, 8, 14); // lunedì 14 settembre 2026
const END = Date.UTC(2027, 5, 6); // domenica 6 giugno 2027
const DAY_MS = 24 * 60 * 60 * 1000;

export const LAST_DAY = Math.round((END - START) / DAY_MS) + 1;

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** 0 = lunedì, 6 = domenica. */
export function dayOfWeek(day: number): number {
  return (day - 1) % 7;
}

export function isWeekend(day: number): boolean {
  return dayOfWeek(day) >= 5;
}

export function isSchoolDay(day: number): boolean {
  return !isWeekend(day);
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
