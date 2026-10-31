import { ACTIONS } from '../actions';
import { dayOf, FINE_QUADRIMESTRE, formatDay, isDiscoNight, isSchoolDay, LAST_DAY, NATALE } from '../calendar';
import {
  actionBlocked,
  buyItem,
  fillTank,
  pagella,
  performAction,
  repairMotorino,
  resolveEvent,
  sleep,
  statDeltas,
  truccaMotorino,
} from '../engine';
import { choiceLabel, EVENTS, EVENTS_BY_ID } from '../events';
import { ITEMS } from '../items';
import { figosita, materiaDelGiorno, migrate, newGame, titoloGiargia } from '../state';
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
const nuovo = (over: Partial<GameState> = {}): GameState => ({ ...newGame('Kevin', 'm', 'ragazze'), ...over });
const scooter = (over: Partial<NonNullable<GameState['motorino']>> = {}) => ({
  id: 'scooter_rotto',
  condizione: 100,
  truccato: false,
  benzina: 100,
  ...over,
});

describe('calendario', () => {
  it('parte da lunedì 14 settembre e finisce a giugno', () => {
    expect(formatDay(1)).toBe('Lun 14 set');
    expect(formatDay(LAST_DAY)).toBe('Dom 6 giu');
    expect(formatDay(NATALE)).toBe('Ven 25 dic');
  });

  it('la disco apre solo venerdì e sabato', () => {
    expect(isDiscoNight(5)).toBe(true);
    expect(isDiscoNight(6)).toBe(true);
    expect(isDiscoNight(7)).toBe(false);
    expect(isDiscoNight(1)).toBe(false);
  });

  it('nelle vacanze non c’è scuola', () => {
    expect(isSchoolDay(dayOf(2026, 12, 28))).toBe(false);
    expect(isSchoolDay(dayOf(2026, 12, 8))).toBe(false);
    expect(isSchoolDay(dayOf(2027, 1, 7))).toBe(true);
    expect(actionBlocked(nuovo({ day: dayOf(2026, 12, 28) }), 'scuola_segui')).toMatch(/Vacanze di Natale/);
  });
});

describe('genere', () => {
  it('i testi si adattano al genere', () => {
    const m = nuovo({ energia: 0 });
    const f = { ...m, genere: 'f' as const };
    expect(actionBlocked(m, 'volantini')).toBe('Sei troppo stanco');
    expect(actionBlocked(f, 'volantini')).toBe('Sei troppo stanca');
    expect(titoloGiargia(m)).toBe('Sfigato cosmico');
    expect(titoloGiargia(f)).toBe('Sfigata cosmica');
    expect(sleep(f, always(0.99)).messages[0]).toMatch(/andata a scuola/);
  });

  it('anche le scelte degli eventi', () => {
    const vigile = EVENTS.find((e) => e.id === 'vigile')!;
    expect(choiceLabel(vigile.scelte[1], nuovo())).toBe('Faccio il simpatico');
    expect(choiceLabel(vigile.scelte[1], nuovo({ genere: 'f' }))).toBe('Faccio la simpatica');
  });
});

describe('salvataggi', () => {
  it('converte un salvataggio della prima versione', () => {
    const { genere, voti, lavoro, ...rest } = nuovo({ motorino: scooter() });
    const vecchio = { ...rest, version: 1, motorino: { id: 'scooter_rotto', condizione: 80, truccato: false } };
    const s = migrate(JSON.parse(JSON.stringify(vecchio)))!;
    expect(s.version).toBe(2);
    expect(s.genere).toBe('m');
    expect(s.voti.matematica).toBe(6);
    expect(s.lavoro).toBeNull();
    expect(s.motorino?.benzina).toBe(100);
  });

  it('scarta dati non validi', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ version: 99 })).toBeNull();
  });
});

describe('azioni', () => {
  it('scala energia e soldi e applica gli effetti', () => {
    const s = nuovo();
    const { state } = performAction(s, 'ripetizioni', always(0.5));
    expect(state.soldi).toBe(s.soldi - 15);
    expect(state.energia).toBe(s.energia - 15);
    expect(state.studio).toBe(s.studio + 9);
    expect(state.log[0].text).toMatch(/secchione/);
  });

  it('blocca le azioni senza energia', () => {
    const s = nuovo({ energia: 10 });
    expect(actionBlocked(s, 'volantini')).toBe('Sei troppo stanco');
    expect(performAction(s, 'volantini', always(0.5)).state).toBe(s);
  });

  it('a scuola si va una volta sola al giorno, e non nel weekend', () => {
    const s = nuovo();
    const { state } = performAction(s, 'scuola_segui', always(0.5));
    expect(actionBlocked(state, 'scuola_segui')).toMatch(/andata/);
    expect(actionBlocked({ ...s, day: 6 }, 'scuola_segui')).toMatch(/non c’è scuola/);
  });

  it('rimorchiare con successo crea un partner', () => {
    const state = { ...performAction(nuovo(), 'corteggia', always(0)).state, pendingEventId: null };
    expect(state.partner).not.toBeNull();
    expect(actionBlocked(state, 'corteggia')).not.toBeNull();
    expect(actionBlocked(state, 'esci_partner')).toBeNull();
  });

  it('per chattare e postare serve il telefono giusto', () => {
    const s = nuovo({ partner: { nome: 'Asia', affetto: 50, giorni: 1 } });
    expect(actionBlocked(s, 'chatta_partner')).toMatch(/telefono/);
    expect(actionBlocked(s, 'social')).toMatch(/smartphone/);
    const conTel = { ...s, inventario: ['conchiglia'] };
    expect(actionBlocked(conTel, 'chatta_partner')).toBeNull();
    expect(actionBlocked(conTel, 'social')).toMatch(/smartphone/);
    expect(actionBlocked({ ...s, inventario: ['smartphone'] }, 'social')).toBeNull();
  });

  it('ogni azione produce uno stato valido', () => {
    const rng = seeded(42);
    const base = nuovo({
      day: 5,
      soldi: 500,
      inventario: ['smartphone'],
      partner: { nome: 'Asia', affetto: 50, giorni: 3 },
      motorino: scooter({ condizione: 50 }),
      lavoro: { id: 'pizzeria', ultimoTurno: 1 },
    });
    for (const a of ACTIONS) {
      const { state, messages } = performAction(base, a.id, rng);
      expect(messages.length).toBeGreaterThan(0);
      expect(state.energia).toBeGreaterThanOrEqual(0);
      expect(state.soldi).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('lavoro fisso', () => {
  it('assunzione, turno e un solo turno al giorno', () => {
    let s = performAction(nuovo(), 'cerca_lavoro', always(0)).state;
    expect(s.lavoro).not.toBeNull();
    const soldi = s.soldi;
    s = performAction(s, 'turno', always(0.9)).state;
    expect(s.soldi).toBeGreaterThan(soldi);
    expect(actionBlocked(s, 'turno')).toMatch(/fatto/);
  });

  it('se non ti presenti per una settimana ti licenziano', () => {
    let s = nuovo({ lavoro: { id: 'gelateria', ultimoTurno: 1 }, scuolaOggi: true });
    for (let i = 0; i < 6; i++) s = sleep({ ...s, scuolaOggi: true }, always(0.99)).state;
    expect(s.lavoro).not.toBeNull();
    const last = sleep({ ...s, scuolaOggi: true }, always(0.99));
    expect(last.state.lavoro).toBeNull();
    expect(last.messages.some((m) => m.includes('licenziato'))).toBe(true);
  });
});

describe('negozio', () => {
  it('i vestiti aumentano la figosità e non si comprano due volte', () => {
    const s = nuovo({ soldi: 200 });
    const { state } = buyItem(s, 'sneakers');
    expect(state.soldi).toBe(200 - ITEMS.sneakers.prezzo);
    expect(figosita(state)).toBe(figosita(s) + ITEMS.sneakers.figo);
    expect(buyItem(state, 'sneakers').state).toBe(state);
  });

  it('i consumabili danno energia subito', () => {
    expect(buyItem(nuovo({ energia: 20 }), 'energy').state.energia).toBe(50);
  });

  it('non si compra senza soldi', () => {
    expect(buyItem(nuovo(), 'scooter_bestia').messages[0]).toMatch(/Ti mancano/);
  });

  it('motorino: comprare, truccare, riparare e fare benzina', () => {
    let s = nuovo({ soldi: 1000 });
    s = buyItem(s, 'scooter_rotto').state;
    expect(s.motorino).toEqual({ id: 'scooter_rotto', condizione: 100, truccato: false, benzina: 100 });
    s = truccaMotorino(s).state;
    expect(s.motorino?.truccato).toBe(true);
    s = { ...s, motorino: { ...s.motorino!, condizione: 40, benzina: 30 } };
    const soldi = s.soldi;
    s = repairMotorino(s).state;
    s = fillTank(s).state;
    expect(s.motorino?.condizione).toBe(100);
    expect(s.motorino?.benzina).toBe(100);
    expect(s.soldi).toBe(soldi - 90 - 10);
  });

  it('un motorino rotto o a secco non dà figosità', () => {
    expect(figosita(nuovo({ motorino: scooter({ condizione: 0 }) }))).toBe(10);
    expect(figosita(nuovo({ motorino: scooter({ benzina: 0 }) }))).toBe(10);
    expect(figosita(nuovo({ motorino: scooter() }))).toBe(18);
  });
});

describe('fine giornata', () => {
  it('saltare la scuola dà un’assenza', () => {
    const { state } = sleep(nuovo(), always(0.99));
    expect(state.day).toBe(2);
    expect(state.assenze).toBe(1);
    expect(state.scuolaOggi).toBe(false);
  });

  it('il lunedì arriva la paghetta', () => {
    const { state, messages } = sleep(nuovo({ day: 7, soldi: 0, genitori: 50 }), always(0.99));
    expect(state.soldi).toBe(20);
    expect(messages.some((m) => m.includes('paghetta'))).toBe(true);
  });

  it('a Natale arrivano i regali dei parenti', () => {
    const { state, messages } = sleep(nuovo({ day: NATALE - 1, soldi: 0 }), always(0.99));
    expect(state.soldi).toBe(100);
    expect(messages.some((m) => m.includes('Natale'))).toBe(true);
  });

  it('a fine gennaio arriva la pagella del quadrimestre', () => {
    const s = nuovo({ day: FINE_QUADRIMESTRE, voti: { ...nuovo().voti, matematica: 4 } });
    const { state, messages } = sleep(s, always(0.99));
    expect(messages.some((m) => m.includes('1 insufficienze'))).toBe(true);
    expect(state.genitori).toBe(s.genitori - 5);
  });

  it('il motorino consuma benzina', () => {
    const { state } = sleep(nuovo({ day: 6, motorino: scooter({ benzina: 4 }) }), always(0.99));
    expect(state.motorino?.benzina).toBe(0);
  });

  it('il partner trascurato alla fine ti molla', () => {
    const { state } = sleep(nuovo({ day: 6, partner: { nome: 'Giada', affetto: 3, giorni: 10 } }), always(0.99));
    expect(state.partner).toBeNull();
    expect(state.exPartners).toBe(1);
  });

  it('a volte arriva un evento che blocca le azioni finché non rispondi', () => {
    const { state } = sleep(nuovo({ scuolaOggi: true }), always(0.1));
    expect(state.pendingEventId).not.toBeNull();
    expect(actionBlocked(state, 'piazzetta')).toMatch(/evento/);
    expect(sleep(state, always(0.1)).state).toBe(state);
    expect(resolveEvent(state, 0, always(0.5)).state.pendingEventId).toBeNull();
  });

  it('l’anno finisce a giugno', () => {
    const { state } = sleep(nuovo({ day: LAST_DAY }), always(0.99));
    expect(state.finito).toBe(true);
    expect(actionBlocked(state, 'piazzetta')).not.toBeNull();
  });
});

describe('imprevisti di giorno', () => {
  it('dopo un’azione può capitare un imprevisto legato a quella azione', () => {
    const { state } = performAction(nuovo(), 'scuola_segui', always(0.1));
    expect(['interrogazione', 'verifica']).toContain(state.pendingEventId);
    expect(actionBlocked(state, 'piazzetta')).toMatch(/evento/);
  });

  it('di solito però non succede niente', () => {
    expect(performAction(nuovo(), 'scuola_segui', always(0.5)).state.pendingEventId).toBeNull();
  });

  it('gli imprevisti di lavoro arrivano solo durante il turno', () => {
    const s = nuovo({ lavoro: { id: 'pizzeria', ultimoTurno: 0 } });
    const { state } = performAction(s, 'turno', always(0.1));
    expect(['capo_extra', 'cliente_furioso']).toContain(state.pendingEventId);
    expect(performAction(s, 'studia_casa', always(0.1)).state.pendingEventId).toBeNull();
  });

  it('gli eventi solo diurni non capitano mai di notte', () => {
    const solo = EVENTS.filter((e) => e.soloGiorno);
    expect(solo.length).toBeGreaterThanOrEqual(4);
    solo.forEach((e) => expect(e.dopo?.length).toBeGreaterThan(0));
    const rng = seeded(3);
    let s = nuovo({ figo: 80, inventario: ['conchiglia'], lavoro: { id: 'pizzeria', ultimoTurno: 0 } });
    for (let i = 0; i < 200; i++) {
      s = sleep({ ...s, pendingEventId: null, scuolaOggi: true, finito: false, day: 2 + (i % 100) }, rng).state;
      if (s.pendingEventId) expect(solo.map((e) => e.id)).not.toContain(s.pendingEventId);
    }
  });
});

describe('eventi', () => {
  it('l’interrogazione mette il voto nella materia del giorno', () => {
    const s = nuovo({ day: 2, studio: 100, pendingEventId: 'interrogazione' });
    const materia = materiaDelGiorno(2).id;
    const { state } = resolveEvent(s, 0, always(0.5));
    expect(state.voti[materia]).toBeGreaterThan(6);
  });

  it('ogni scelta di ogni evento produce uno stato valido', () => {
    const rng = seeded(7);
    const s = nuovo({
      day: 30,
      soldi: 10,
      figo: 60,
      inventario: ['conchiglia'],
      exPartners: 1,
      partner: { nome: 'Thomas', affetto: 50, giorni: 30 },
      motorino: scooter({ condizione: 30, truccato: true }),
      lavoro: { id: 'scarpe', ultimoTurno: 29 },
    });
    expect(EVENTS.length).toBeGreaterThanOrEqual(20);
    for (const e of EVENTS) {
      expect(e.testo(s).length).toBeGreaterThan(0);
      e.scelte.forEach((c, i) => {
        expect(choiceLabel(c, s).length).toBeGreaterThan(0);
        const { state, messages } = resolveEvent({ ...s, pendingEventId: e.id }, i, rng);
        expect(messages.length).toBeGreaterThan(0);
        expect(state.pendingEventId).toBeNull();
        expect(state.soldi).toBeGreaterThanOrEqual(0);
      });
    }
  });
});

describe('pagella e simulazione', () => {
  it('chi studia viene promosso, chi no viene bocciato', () => {
    expect(pagella(nuovo({ studio: 80 })).promosso).toBe(true);
    expect(pagella(nuovo({ studio: 20 })).promosso).toBe(false);
  });

  it('con una o due insufficienze si è promossi con debito', () => {
    const p = pagella(nuovo({ studio: 60, voti: { ...nuovo().voti, matematica: 2 } }));
    expect(p.promosso).toBe(true);
    expect(p.debiti).toEqual(['Matematica']);
    expect(p.giudizio).toMatch(/debito in Matematica/);
  });

  it('troppe assenze vuol dire bocciatura', () => {
    const p = pagella(nuovo({ studio: 90, assenze: 60, genere: 'f' }));
    expect(p.promosso).toBe(false);
    expect(p.giudizio).toMatch(/Bocciata per le assenze/);
  });

  it('statDeltas riporta solo le statistiche cambiate', () => {
    const s = nuovo();
    expect(statDeltas(s, { ...s, soldi: s.soldi + 10, energia: s.energia - 5 })).toEqual([
      { key: 'soldi', value: 10 },
      { key: 'energia', value: -5 },
    ]);
  });

  it.each(['m', 'f'] as const)('si può giocare un anno intero senza errori (%s)', (genere) => {
    const rng = seeded(genere === 'm' ? 1234 : 99);
    let s = newGame('Bot', genere, 'tutti');
    let guard = 0;
    while (!s.finito && guard++ < 6000) {
      if (s.pendingEventId) {
        s = resolveEvent(s, Math.floor(rng() * EVENTS_BY_ID[s.pendingEventId].scelte.length), rng).state;
        continue;
      }
      const possibili = ACTIONS.filter((a) => actionBlocked(s, a.id) === null);
      if (possibili.length && rng() < 0.7) {
        s = performAction(s, possibili[Math.floor(rng() * possibili.length)].id, rng).state;
      } else if (rng() < 0.1 && s.soldi > 60) {
        const ids = Object.keys(ITEMS);
        s = buyItem(s, ids[Math.floor(rng() * ids.length)]).state;
      } else {
        s = sleep(s, rng).state;
      }
    }
    expect(s.finito).toBe(true);
    expect(s.day).toBe(LAST_DAY);
    expect(pagella(s).giudizio.length).toBeGreaterThan(0);
  });
});
