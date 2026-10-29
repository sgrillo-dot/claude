import { ACTIONS_BY_ID } from './actions';
import { BEFANA, dayOfWeek, FINE_QUADRIMESTRE, festa, isSchoolDay, LAST_DAY, NATALE } from './calendar';
import { EVENTS, EVENTS_BY_ID } from './events';
import { COSTO_TRUCCO, costoPieno, costoRiparazione, ITEMS, LAVORI_BY_ID } from './items';
import { addLog, applyDelta, figosita, g, MATERIE, o, outcome } from './state';
import { GameEvent, GameState, Materia, Outcome, Rng } from './types';

const fail = (s: GameState, text: string): Outcome => ({ state: s, messages: [text] });

/** Ritorna il motivo per cui l'azione non si può fare, oppure null. */
export function actionBlocked(s: GameState, actionId: string): string | null {
  const a = ACTIONS_BY_ID[actionId];
  if (!a) return 'Azione sconosciuta';
  if (s.finito) return 'L’anno è finito';
  if (s.pendingEventId) return 'Prima rispondi all’evento';
  const reason = a.bloccata?.(s);
  if (reason) return reason;
  if (s.energia < a.energia) return `Sei troppo stanc${o(s)}`;
  if (s.soldi < a.soldi) return `Ti servono ${a.soldi}€`;
  return null;
}

export function performAction(s: GameState, actionId: string, rng: Rng): Outcome {
  const reason = actionBlocked(s, actionId);
  if (reason) return fail(s, reason);
  const a = ACTIONS_BY_ID[actionId];
  return a.esegui(applyDelta(s, { energia: -a.energia, soldi: -a.soldi }), rng);
}

export function buyItem(s: GameState, itemId: string): Outcome {
  const item = ITEMS[itemId];
  if (!item) return fail(s, 'Oggetto sconosciuto');
  if (s.finito) return fail(s, 'L’anno è finito');
  if (s.soldi < item.prezzo) return fail(s, `Ti mancano ${item.prezzo - s.soldi}€`);

  const paid = applyDelta(s, { soldi: -item.prezzo });
  if (item.consumabile) {
    return outcome(paid, `${item.emoji} ${item.nome}: gnam!`, item.consumabile);
  }
  if (item.categoria === 'motorini') {
    if (s.motorino?.id === item.id) return fail(s, 'Ce l’hai già');
    const next = { ...paid, motorino: { id: item.id, condizione: 100, truccato: false, benzina: 100 } };
    return outcome(next, `Hai comprato ${item.nome}! Brum brum. 🛵`);
  }
  if (s.inventario.includes(item.id)) return fail(s, 'Ce l’hai già');
  return outcome({ ...paid, inventario: [...paid.inventario, item.id] }, `Hai comprato ${item.nome}. Che stile!`);
}

export function repairMotorino(s: GameState): Outcome {
  if (!s.motorino) return fail(s, 'Non hai un motorino');
  if (s.motorino.condizione >= 100) return fail(s, 'Il motorino è perfetto');
  const costo = costoRiparazione(s.motorino.condizione);
  if (s.soldi < costo) return fail(s, `La riparazione costa ${costo}€`);
  const next = { ...s, motorino: { ...s.motorino, condizione: 100 } };
  return outcome(next, 'Motorino come nuovo. Il meccanico ti fa l’occhiolino.', { soldi: -costo });
}

export function truccaMotorino(s: GameState): Outcome {
  if (!s.motorino) return fail(s, 'Non hai un motorino');
  if (s.motorino.truccato) return fail(s, 'È già truccato');
  if (s.soldi < COSTO_TRUCCO) return fail(s, `Ti servono ${COSTO_TRUCCO}€`);
  const next = { ...s, motorino: { ...s.motorino, truccato: true } };
  return outcome(next, 'Marmitta nuova: ora si sente da Milano. Occhio ai vigili!', { soldi: -COSTO_TRUCCO });
}

export function fillTank(s: GameState): Outcome {
  if (!s.motorino) return fail(s, 'Non hai un motorino');
  if (s.motorino.benzina >= 100) return fail(s, 'Il serbatoio è già pieno');
  const costo = costoPieno(s.motorino.benzina);
  if (s.soldi < costo) return fail(s, `Il pieno costa ${costo}€`);
  const next = { ...s, motorino: { ...s.motorino, benzina: 100 } };
  return outcome(next, `Pieno fatto con ${costo}€. Profumo di miscela. ⛽`, { soldi: -costo });
}

function pickEvent(s: GameState, rng: Rng): GameEvent | null {
  const eligible = EVENTS.filter((e) => !e.condizione || e.condizione(s));
  const total = eligible.reduce((sum, e) => sum + e.peso, 0);
  let r = rng() * total;
  for (const e of eligible) {
    r -= e.peso;
    if (r < 0) return e;
  }
  return null;
}

export const EVENT_CHANCE = 0.45;

/** Fine giornata: si va a dormire e il mondo va avanti. */
export function sleep(s: GameState, rng: Rng): Outcome {
  if (s.finito) return fail(s, 'L’anno è finito');
  if (s.pendingEventId) return fail(s, 'Prima rispondi all’evento');

  const messages: string[] = [];
  let next = s;
  const note = (text: string) => {
    messages.push(text);
    next = addLog(next, text);
  };

  if (isSchoolDay(s.day) && !s.scuolaOggi) {
    next = applyDelta({ ...next, assenze: next.assenze + 1 }, { genitori: -6 });
    note(`Oggi non sei andat${o(s)} a scuola: assenza ingiustificata!`);
  }

  next = applyDelta({ ...next, day: s.day + 1, scuolaOggi: false }, { energia: 65, figo: -1 });
  if (isSchoolDay(s.day)) next = applyDelta(next, { studio: -1 });

  if (next.motorino) {
    const m = next.motorino;
    const condizione = Math.max(0, m.condizione - (m.truccato ? 3 : 2));
    const benzina = Math.max(0, m.benzina - (m.truccato ? 9 : 6));
    next = { ...next, motorino: { ...m, condizione, benzina } };
    if (condizione === 0 && m.condizione > 0) note('Il motorino ti ha lasciato a piedi. Va riparato!');
    else if (benzina === 0 && m.benzina > 0) note('Il motorino è a secco: fai benzina nei Negozi.');
  }

  if (next.partner) {
    const affetto = next.partner.affetto - 3;
    if (affetto <= 0) {
      const nome = next.partner.nome;
      next = applyDelta({ ...next, partner: null, exPartners: next.exPartners + 1 }, { figo: -5 });
      note(`${nome} ti ha ${g(s, 'mollato', 'mollata')}. “Non mi caghi mai.” 💔`);
    } else {
      next = { ...next, partner: { ...next.partner, affetto, giorni: next.partner.giorni + 1 } };
    }
  }

  if (next.lavoro && next.day - next.lavoro.ultimoTurno >= 7) {
    const job = LAVORI_BY_ID[next.lavoro.id];
    next = applyDelta({ ...next, lavoro: null }, { figo: -2 });
    note(`Non ti presenti da una settimana: ${job.nome} ti ha ${g(s, 'licenziato', 'licenziata')}.`);
  }

  if (dayOfWeek(next.day) === 0) {
    const paghetta = 10 + Math.floor(next.genitori / 5);
    next = applyDelta(next, { soldi: paghetta });
    note(`È lunedì: paghetta di ${paghetta}€.`);
  }

  const vacanza = festa(next.day);
  if (vacanza && vacanza !== festa(s.day)) note(`🎈 ${vacanza}: niente scuola!`);

  if (next.day === NATALE) {
    next = applyDelta(next, { soldi: 100, energia: 30 });
    note('🎄 Buon Natale! Tra nonni e zii hai raccolto 100€.');
  }
  if (next.day === BEFANA) {
    next = applyDelta(next, { soldi: 10 });
    note('🧦 La Befana ti ha lasciato carbone di zucchero e 10€.');
  }
  if (next.day === FINE_QUADRIMESTRE + 1) {
    const { media, insufficienze } = mediaVoti(next);
    const contenti = insufficienze === 0;
    next = applyDelta(next, { genitori: contenti ? 10 : -5 * insufficienze });
    note(
      `📄 Pagella del primo quadrimestre: media ${media.toFixed(1)}` +
        (contenti ? ', tutto sufficiente. I tuoi sono fieri!' : `, ${insufficienze} insufficienze. A casa è tempesta.`),
    );
  }

  if (next.day > LAST_DAY) {
    next = { ...next, day: LAST_DAY, finito: true };
    note('Suona l’ultima campanella: l’anno scolastico è finito!');
    return { state: next, messages };
  }

  if (rng() < EVENT_CHANCE) {
    const e = pickEvent(next, rng);
    if (e) next = { ...next, pendingEventId: e.id };
  }

  return { state: next, messages };
}

export function pendingEvent(s: GameState): GameEvent | null {
  return s.pendingEventId ? EVENTS_BY_ID[s.pendingEventId] ?? null : null;
}

export function resolveEvent(s: GameState, choiceIndex: number, rng: Rng): Outcome {
  const e = pendingEvent(s);
  if (!e) return fail({ ...s, pendingEventId: null }, 'Nessun evento');
  const choice = e.scelte[choiceIndex];
  if (!choice) return fail(s, 'Scelta non valida');
  return choice.esito({ ...s, pendingEventId: null }, rng);
}

export function mediaVoti(s: GameState): { media: number; insufficienze: number } {
  const voti = MATERIE.map((m) => s.voti[m.id]);
  return {
    media: voti.reduce((a, b) => a + b, 0) / voti.length,
    insufficienze: voti.filter((v) => v < 6).length,
  };
}

export interface Pagella {
  voti: Record<Materia, number>;
  media: number;
  debiti: string[];
  promosso: boolean;
  figosita: number;
  giudizio: string;
}

/** Il voto finale di ogni materia è la media tra registro e preparazione generale. */
export function pagella(s: GameState): Pagella {
  const preparazione = 3 + s.studio / 14;
  const voti = Object.fromEntries(
    MATERIE.map((m) => [m.id, Math.max(2, Math.min(10, Math.round((s.voti[m.id] + preparazione) / 2)))]),
  ) as Record<Materia, number>;
  const insufficienti = MATERIE.filter((m) => voti[m.id] < 6);
  const media = MATERIE.reduce((sum, m) => sum + voti[m.id], 0) / MATERIE.length;
  const promosso = insufficienti.length <= 2 && s.assenze <= 50;
  const debiti = promosso ? insufficienti.map((m) => m.nome) : [];
  const f = figosita(s);
  const promossa = g(s, 'Promosso', 'Promossa');
  const bocciata = g(s, 'Bocciato', 'Bocciata');
  let giudizio: string;
  if (s.assenze > 50) giudizio = `${bocciata} per le assenze: ${s.assenze} giorni di sega. Leggendario, ma inutile.`;
  else if (promosso && debiti.length) giudizio = `${promossa} con debito in ${debiti.join(' e ')}. Estate sui libri!`;
  else if (promosso && f >= 60) giudizio = `${promossa} e idolo della scuola. Sei la leggenda dei giargia.`;
  else if (promosso) giudizio = `${promossa}! I tuoi genitori ti guardano con sospetto, ma sono felici.`;
  else if (f >= 60) giudizio = `${bocciata}, ma col look più figo della città. Ne valeva la pena?`;
  else giudizio = `${bocciata} e pure sfigat${o(s)}. L’anno prossimo andrà meglio. Forse.`;
  return { voti, media, debiti, promosso, figosita: f, giudizio };
}

export type StatDelta = { key: 'soldi' | 'figo' | 'studio' | 'energia' | 'genitori'; value: number };

/** Differenze visibili tra due stati, per mostrare “+5 figo” all’utente. */
export function statDeltas(prev: GameState, next: GameState): StatDelta[] {
  const out: StatDelta[] = [];
  const push = (key: StatDelta['key'], value: number) => value !== 0 && out.push({ key, value });
  push('soldi', next.soldi - prev.soldi);
  push('figo', figosita(next) - figosita(prev));
  push('studio', next.studio - prev.studio);
  push('energia', next.energia - prev.energia);
  push('genitori', next.genitori - prev.genitori);
  return out;
}
