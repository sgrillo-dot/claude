import { isDiscoNight, isSchoolDay } from './calendar';
import { chance, figosita, outcome, randomPartnerName } from './state';
import { Action, GameState } from './types';

const soloGiorniDiScuola = (s: GameState) =>
  !isSchoolDay(s.day) ? 'Oggi non c’è scuola' : s.scuolaOggi ? 'Per oggi la scuola è andata' : null;

const serveSingle = (s: GameState) => (s.partner ? 'Hai già qualcuno, giargia' : null);
const servePartner = (s: GameState) => (s.partner ? null : 'Prima trova qualcuno con cui uscire');

export const ACTIONS: Action[] = [
  // ---------------------------------------------------------------- Scuola
  {
    id: 'scuola_segui',
    tab: 'scuola',
    emoji: '✏️',
    titolo: 'Segui le lezioni',
    descrizione: 'Prendi appunti, alzi pure la mano. Chi sei?',
    energia: 25,
    soldi: 0,
    bloccata: soloGiorniDiScuola,
    esegui: (s) =>
      outcome({ ...s, scuolaOggi: true }, 'Hai seguito tutte le lezioni. Il prof quasi piange.', {
        studio: 6,
        figo: -1,
        genitori: 2,
      }),
  },
  {
    id: 'scuola_dormi',
    tab: 'scuola',
    emoji: '😴',
    titolo: 'Dormi all’ultimo banco',
    descrizione: 'Presente col corpo, assente con lo spirito.',
    energia: 0,
    soldi: 0,
    bloccata: soloGiorniDiScuola,
    esegui: (s, rng) => {
      const next = { ...s, scuolaOggi: true };
      if (chance(rng, 0.25)) {
        return outcome(next, 'Ti sei messo a russare in classe. Nota sul registro!', {
          energia: 10,
          studio: 1,
          genitori: -8,
        });
      }
      return outcome(next, 'Pisolino strategico: nessuno se n’è accorto.', { energia: 15, studio: 2 });
    },
  },
  {
    id: 'scuola_marina',
    tab: 'scuola',
    emoji: '🏃',
    titolo: 'Fai sega con la compagnia',
    descrizione: 'Giornata ai giardinetti. Rischioso, ma figo.',
    energia: 15,
    soldi: 0,
    bloccata: soloGiorniDiScuola,
    esegui: (s, rng) => {
      const next = { ...s, scuolaOggi: true, assenze: s.assenze + 1 };
      if (chance(rng, 0.3)) {
        return outcome(next, 'Beccato! Tua madre è passata proprio dai giardinetti.', {
          figo: 3,
          studio: -3,
          genitori: -15,
        });
      }
      return outcome(next, 'Mattinata leggendaria ai giardinetti. Nessuno ha visto niente.', {
        figo: 5,
        studio: -3,
      });
    },
  },
  {
    id: 'studia_casa',
    tab: 'scuola',
    emoji: '📖',
    titolo: 'Studia a casa',
    descrizione: 'Libri aperti, telefono a faccia in giù.',
    energia: 20,
    soldi: 0,
    esegui: (s) => outcome(s, 'Due ore di studio vero. Il cervello fuma.', { studio: 5, figo: -1, genitori: 1 }),
  },
  {
    id: 'ripetizioni',
    tab: 'scuola',
    emoji: '🤓',
    titolo: 'Ripetizioni dal secchione',
    descrizione: 'Ti spiega tutto, a pagamento.',
    energia: 15,
    soldi: 15,
    esegui: (s) => outcome(s, 'Il secchione ti ha spiegato le equazioni. Forse.', { studio: 9 }),
  },

  // ---------------------------------------------------------------- Uscite
  {
    id: 'piazzetta',
    tab: 'uscite',
    emoji: '⛲',
    titolo: 'Vai in piazzetta',
    descrizione: 'Il centro del mondo. Gratis.',
    energia: 10,
    soldi: 0,
    esegui: (s, rng) => {
      if (chance(rng, 0.15)) {
        return outcome(s, 'In piazzetta tutti parlano del tuo look. Grande!', { figo: 4 });
      }
      return outcome(s, 'Due chiacchiere sulla panchina. Sempre i soliti.', { figo: 2 });
    },
  },
  {
    id: 'sala_giochi',
    tab: 'uscite',
    emoji: '🕹️',
    titolo: 'Sala giochi',
    descrizione: 'Gettoni, flipper e record da battere.',
    energia: 10,
    soldi: 5,
    esegui: (s, rng) => {
      if (chance(rng, 0.2)) {
        return outcome(s, 'Hai vinto il torneo di calcio balilla: 15€ di premio!', { soldi: 15, figo: 3 });
      }
      return outcome(s, 'Un’ora a picchiare tasti. Nuovo record personale.', { figo: 1, energia: 5 });
    },
  },
  {
    id: 'disco',
    tab: 'uscite',
    emoji: '🪩',
    titolo: 'Serata in disco',
    descrizione: 'Solo venerdì e sabato. Il buttafuori guarda il look.',
    energia: 35,
    soldi: 20,
    bloccata: (s) => (isDiscoNight(s.day) ? null : 'La disco apre solo venerdì e sabato'),
    esegui: (s, rng) => {
      if (figosita(s) < 20) {
        return outcome(s, 'Il buttafuori ti squadra: “Stasera no.” Almeno ti ha ridato i soldi.', {
          soldi: 20,
          figo: -2,
        });
      }
      if (!s.partner && chance(rng, 0.12 + figosita(s) / 400)) {
        const nome = randomPartnerName(s.preferenza, rng);
        const next = { ...s, partner: { nome, affetto: 45, giorni: 0 } };
        return outcome(next, `Lento con ${nome}… e alla fine vi siete messi insieme! 💘`, { figo: 6 });
      }
      return outcome(s, 'Hai ballato fino alla chiusura. Domani non ti alzi.', { figo: 6 });
    },
  },
  {
    id: 'corteggia',
    tab: 'uscite',
    emoji: '😏',
    titolo: 'Prova a rimorchiare',
    descrizione: 'Più sei figo, più è facile.',
    energia: 15,
    soldi: 0,
    bloccata: serveSingle,
    esegui: (s, rng) => {
      const nome = randomPartnerName(s.preferenza, rng);
      if (chance(rng, 0.1 + figosita(s) / 130)) {
        const next = { ...s, partner: { nome, affetto: 40, giorni: 0 } };
        return outcome(next, `${nome} ti ha detto di sì! Siete ufficialmente insieme. 💘`, { figo: 4 });
      }
      return outcome(s, `Hai provato con ${nome}: due di picche. Succede ai migliori.`, { figo: -2 });
    },
  },
  {
    id: 'esci_partner',
    tab: 'uscite',
    emoji: '🍕',
    titolo: 'Pizza romantica',
    descrizione: 'Paghi tu, ovviamente.',
    energia: 20,
    soldi: 15,
    bloccata: servePartner,
    esegui: (s) => {
      const p = s.partner!;
      const next = { ...s, partner: { ...p, affetto: Math.min(100, p.affetto + 15) } };
      return outcome(next, `Pizza e passeggiata con ${p.nome}. Che romantico.`, { figo: 1 });
    },
  },
  {
    id: 'regalo_partner',
    tab: 'uscite',
    emoji: '🎁',
    titolo: 'Fai un regalo',
    descrizione: 'Un peluche gigante non sbaglia mai.',
    energia: 5,
    soldi: 25,
    bloccata: servePartner,
    esegui: (s) => {
      const p = s.partner!;
      const next = { ...s, partner: { ...p, affetto: Math.min(100, p.affetto + 25) } };
      return outcome(next, `${p.nome} ha adorato il peluche. Ti scrive “sei il top”.`);
    },
  },
  {
    id: 'lascia_partner',
    tab: 'uscite',
    emoji: '💔',
    titolo: 'Chiudi la storia',
    descrizione: 'Con un vocale, come si fa oggi.',
    energia: 0,
    soldi: 0,
    bloccata: servePartner,
    esegui: (s) => {
      const p = s.partner!;
      const next = { ...s, partner: null, exPartners: s.exPartners + 1 };
      return outcome(next, `Hai mollato ${p.nome} con un vocale di 4 minuti. Spietato.`, { figo: 1 });
    },
  },

  // ---------------------------------------------------------------- Lavoro
  {
    id: 'volantini',
    tab: 'lavoro',
    emoji: '📰',
    titolo: 'Distribuisci volantini',
    descrizione: 'Per la pizzeria del quartiere. Speri che nessuno ti veda.',
    energia: 30,
    soldi: 0,
    esegui: (s) => outcome(s, 'Mille volantini nelle cassette. Paga: 12€.', { soldi: 12, figo: -1 }),
  },
  {
    id: 'pizzeria',
    tab: 'lavoro',
    emoji: '🍽️',
    titolo: 'Lavapiatti in pizzeria',
    descrizione: 'Turno lungo, mani a mollo.',
    energia: 45,
    soldi: 0,
    esegui: (s, rng) => {
      const mancia = chance(rng, 0.3) ? 8 : 0;
      const text = mancia
        ? 'Turno in pizzeria: 30€ più 8€ di mancia dal pizzaiolo!'
        : 'Turno in pizzeria: 30€ e le mani come prugne.';
      return outcome(s, text, { soldi: 30 + mancia });
    },
  },
  {
    id: 'officina',
    tab: 'lavoro',
    emoji: '🔧',
    titolo: 'Aiuta il meccanico',
    descrizione: 'Paga così così, ma ti sistema il motorino.',
    energia: 35,
    soldi: 0,
    esegui: (s) => {
      if (s.motorino) {
        const m = { ...s.motorino, condizione: Math.min(100, s.motorino.condizione + 20) };
        return outcome({ ...s, motorino: m }, 'Pomeriggio in officina: 20€ e una sistemata al motorino.', {
          soldi: 20,
        });
      }
      return outcome(s, 'Pomeriggio in officina: 20€ e le mani nere di grasso.', { soldi: 20 });
    },
  },
  {
    id: 'chiedi_soldi',
    tab: 'lavoro',
    emoji: '🙏',
    titolo: 'Chiedi soldi ai genitori',
    descrizione: 'Funziona se sono di buon umore. Una volta a settimana.',
    energia: 0,
    soldi: 0,
    bloccata: (s) => (s.day - s.richiestaSoldiDay < 7 ? 'Hai già chiesto questa settimana' : null),
    esegui: (s) => {
      const next = { ...s, richiestaSoldiDay: s.day };
      if (s.genitori >= 60) {
        return outcome(next, '“Va bene, ma studia!” Ti hanno dato 25€.', { soldi: 25, genitori: -8 });
      }
      return outcome(next, '“Con i voti che hai? Scordatelo.”', { genitori: -5 });
    },
  },
];

export const ACTIONS_BY_ID: Record<string, Action> = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));
