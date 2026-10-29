import { ACTIONS } from '../actions';
import { formatDay, isDiscoNight, LAST_DAY } from '../calendar';
import {
  actionBlocked,
  buyItem,
  pagella,
  performAction,
  repairMotorino,
  resolveEvent,
  sleep,
  statDeltas,
  truccaMotorino,
} from '../engine';
import { EVENTS } from '../events';
import { ITEMS } from '../items';
import { figosita, newGame } from '../state';
import { GameState } from '../types';

/** Generatore pseudo-casuale deterministico per test ripetibili. */
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

const always = (v: number) => () => v;

describe('calendario', () => {
  it('parte da lunedì 14 settembre e finisce a giugno', () => {
    expect(formatDay(1)).toBe('Lun 14 set');
    expect(formatDay(LAST_DAY)).toBe('Dom 6 giu');
  });

  it('la disco apre solo venerdì e sabato', () => {
    expect(isDiscoNight(5)).toBe(true);
    expect(isDiscoNight(6)).toBe(true);
    expect(isDiscoNight(7)).toBe(false);
    expect(isDiscoNight(1)).toBe(false);
  });
});

describe('azioni', () => {
  it('scala energia e soldi e applica gli effetti', () => {
    const s = newGame('Kevin', 'ragazze');
    const { state } = performAction(s, 'ripetizioni', always(0.5));
    expect(state.soldi).toBe(s.soldi - 15);
    expect(state.energia).toBe(s.energia - 15);
    expect(state.studio).toBe(s.studio + 9);
    expect(state.log[0].text).toMatch(/secchione/);
  });

  it('blocca le azioni senza energia', () => {
    const s = { ...newGame('Kevin', 'ragazze'), energia: 10 };
    expect(actionBlocked(s, 'pizzeria')).toBe('Sei troppo stanco');
    expect(performAction(s, 'pizzeria', always(0.5)).state).toBe(s);
  });

  it('a scuola si va una volta sola al giorno, e non nel weekend', () => {
    const s = newGame('Kevin', 'ragazze');
    const { state } = performAction(s, 'scuola_segui', always(0.5));
    expect(actionBlocked(state, 'scuola_segui')).toMatch(/andata/);
    expect(actionBlocked({ ...s, day: 6 }, 'scuola_segui')).toMatch(/non c’è scuola/);
  });

  it('rimorchiare con successo crea un partner', () => {
    const s = newGame('Kevin', 'ragazzi');
    const { state } = performAction(s, 'corteggia', always(0));
    expect(state.partner).not.toBeNull();
    expect(actionBlocked(state, 'corteggia')).not.toBeNull();
    expect(actionBlocked(state, 'esci_partner')).toBeNull();
  });

  it('ogni azione produce uno stato valido', () => {
    const rng = seeded(42);
    const base: GameState = {
      ...newGame('Test', 'tutti'),
      day: 5,
      soldi: 500,
      partner: { nome: 'Asia', affetto: 50, giorni: 3 },
      motorino: { id: 'scooter_rotto', condizione: 50, truccato: false },
    };
    for (const a of ACTIONS) {
      const { state, messages } = performAction(base, a.id, rng);
      expect(messages.length).toBeGreaterThan(0);
      expect(state.energia).toBeGreaterThanOrEqual(0);
      expect(state.soldi).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('negozio', () => {
  it('i vestiti aumentano la figosità e non si comprano due volte', () => {
    const s = { ...newGame('Kevin', 'ragazze'), soldi: 200 };
    const { state } = buyItem(s, 'sneakers');
    expect(state.soldi).toBe(200 - ITEMS.sneakers.prezzo);
    expect(figosita(state)).toBe(figosita(s) + ITEMS.sneakers.figo);
    expect(buyItem(state, 'sneakers').state).toBe(state);
  });

  it('i consumabili danno energia subito', () => {
    const s = { ...newGame('Kevin', 'ragazze'), energia: 20 };
    expect(buyItem(s, 'energy').state.energia).toBe(50);
  });

  it('non si compra senza soldi', () => {
    const s = newGame('Kevin', 'ragazze');
    expect(buyItem(s, 'scooter_bestia').messages[0]).toMatch(/Ti mancano/);
  });

  it('motorino: comprare, truccare e riparare', () => {
    let s: GameState = { ...newGame('Kevin', 'ragazze'), soldi: 1000 };
    s = buyItem(s, 'scooter_rotto').state;
    expect(s.motorino?.condizione).toBe(100);
    s = truccaMotorino(s).state;
    expect(s.motorino?.truccato).toBe(true);
    s = { ...s, motorino: { ...s.motorino!, condizione: 40 } };
    const soldi = s.soldi;
    s = repairMotorino(s).state;
    expect(s.motorino?.condizione).toBe(100);
    expect(s.soldi).toBe(soldi - 90);
  });

  it('un motorino rotto non dà figosità', () => {
    const s: GameState = { ...newGame('Kevin', 'ragazze'), motorino: { id: 'scooter_fulmine', condizione: 0, truccato: false } };
    expect(figosita(s)).toBe(s.figo);
  });
});

describe('fine giornata', () => {
  it('saltare la scuola dà un’assenza', () => {
    const s = newGame('Kevin', 'ragazze');
    const { state } = sleep(s, always(0.99));
    expect(state.day).toBe(2);
    expect(state.assenze).toBe(1);
    expect(state.scuolaOggi).toBe(false);
  });

  it('il lunedì arriva la paghetta', () => {
    const s = { ...newGame('Kevin', 'ragazze'), day: 7, soldi: 0, genitori: 50 };
    const { state, messages } = sleep(s, always(0.99));
    expect(state.soldi).toBe(20);
    expect(messages.some((m) => m.includes('paghetta'))).toBe(true);
  });

  it('il partner trascurato alla fine ti molla', () => {
    const s: GameState = { ...newGame('Kevin', 'ragazze'), day: 6, partner: { nome: 'Giada', affetto: 3, giorni: 10 } };
    const { state } = sleep(s, always(0.99));
    expect(state.partner).toBeNull();
    expect(state.exPartners).toBe(1);
  });

  it('a volte arriva un evento che blocca le azioni finché non rispondi', () => {
    const s = { ...newGame('Kevin', 'ragazze'), scuolaOggi: true };
    const { state } = sleep(s, always(0.1));
    expect(state.pendingEventId).not.toBeNull();
    expect(actionBlocked(state, 'piazzetta')).toMatch(/evento/);
    expect(sleep(state, always(0.1)).state).toBe(state);
    const resolved = resolveEvent(state, 0, always(0.5));
    expect(resolved.state.pendingEventId).toBeNull();
  });

  it('l’anno finisce a giugno', () => {
    const s = { ...newGame('Kevin', 'ragazze'), day: LAST_DAY };
    const { state } = sleep(s, always(0.99));
    expect(state.finito).toBe(true);
    expect(actionBlocked(state, 'piazzetta')).not.toBeNull();
  });
});

describe('eventi', () => {
  it('ogni scelta di ogni evento produce uno stato valido', () => {
    const rng = seeded(7);
    const s: GameState = {
      ...newGame('Test', 'tutti'),
      day: 30,
      soldi: 10,
      figo: 60,
      partner: { nome: 'Thomas', affetto: 50, giorni: 30 },
      motorino: { id: 'scooter_rotto', condizione: 30, truccato: true },
    };
    for (const e of EVENTS) {
      expect(e.testo(s).length).toBeGreaterThan(0);
      e.scelte.forEach((_, i) => {
        const { state, messages } = resolveEvent({ ...s, pendingEventId: e.id }, i, rng);
        expect(messages.length).toBeGreaterThan(0);
        expect(state.pendingEventId).toBeNull();
        expect(state.soldi).toBeGreaterThanOrEqual(0);
      });
    }
  });
});

describe('pagella e simulazione', () => {
  it('chi studia viene promosso', () => {
    const s = { ...newGame('Kevin', 'ragazze'), studio: 80 };
    expect(pagella(s).promosso).toBe(true);
    expect(pagella({ ...s, studio: 20 }).promosso).toBe(false);
  });

  it('statDeltas riporta solo le statistiche cambiate', () => {
    const s = newGame('Kevin', 'ragazze');
    const next = { ...s, soldi: s.soldi + 10, energia: s.energia - 5 };
    expect(statDeltas(s, next)).toEqual([
      { key: 'soldi', value: 10 },
      { key: 'energia', value: -5 },
    ]);
  });

  it('si può giocare un anno intero senza errori', () => {
    const rng = seeded(1234);
    let s = newGame('Bot', 'tutti');
    let guard = 0;
    while (!s.finito && guard++ < 5000) {
      if (s.pendingEventId) {
        s = resolveEvent(s, 0, rng).state;
        continue;
      }
      const possibili = ACTIONS.filter((a) => actionBlocked(s, a.id) === null);
      if (possibili.length && rng() < 0.7) {
        s = performAction(s, possibili[Math.floor(rng() * possibili.length)].id, rng).state;
      } else {
        s = sleep(s, rng).state;
      }
    }
    expect(s.finito).toBe(true);
    expect(s.day).toBe(LAST_DAY);
  });
});
