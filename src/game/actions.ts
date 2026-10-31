import { festa, isDiscoNight, isSchoolDay } from './calendar';
import { LAVORI, LAVORI_BY_ID } from './items';
import {
  chance,
  creaPersona,
  figosita,
  g,
  gp,
  hasSmartphone,
  hasTelefono,
  motorinoFunziona,
  nuovoPartner,
  o,
  outcome,
  pick,
  registraVoto,
} from './state';
import { Action, GameState, Gusto, Outcome, Partner, StatKey } from './types';

const soloGiorniDiScuola = (s: GameState) => {
  if (!isSchoolDay(s.day)) return festa(s.day) ? `${festa(s.day)}: niente scuola!` : 'Oggi non c’è scuola';
  return s.scuolaOggi ? 'Per oggi la scuola è andata' : null;
};

const servePartner = (s: GameState) => (s.partner ? null : 'Prima trova qualcuno con cui uscire');

/** Le azioni di coppia si fanno una volta al giorno: non essere appiccicoso. */
const coppia = (s: GameState, id: string) =>
  servePartner(s) ?? (s.partner!.fatto[id] === s.day ? `Per oggi basta, non essere appiccicos${o(s)}` : null);

function coccola(
  s: GameState,
  id: string,
  affetto: number,
  gustoGiusto: Gusto,
  testo: (p: Partner) => string,
  delta: Partial<Record<StatKey, number>> = {},
): Outcome {
  const p = s.partner!;
  const centrato = p.gusto === gustoGiusto;
  const next = {
    ...s,
    partner: { ...p, affetto: Math.min(100, p.affetto + (centrato ? affetto * 2 : affetto)), fatto: { ...p.fatto, [id]: s.day } },
  };
  return outcome(next, testo(p) + (centrato ? ` ${gp(p, 'Lui', 'Lei')} va pazz${gp(p, 'o', 'a')} per queste cose! 😍` : ''), delta);
}

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
        return outcome(next, `Ti sei mess${o(s)} a russare in classe. Nota sul registro!`, {
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
        return outcome(next, `Beccat${o(s)}! Tua madre è passata proprio dai giardinetti.`, {
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
        const p = creaPersona(s.preferenza, rng, Math.max(15, Math.min(90, figosita(s) + Math.floor(rng() * 20) - 10)));
        const next = { ...s, partner: nuovoPartner(p, 45) };
        return outcome(next, `Lento con ${p.nome}… e alla fine vi siete messi insieme! 💘`, { figo: 6 });
      }
      return outcome(s, 'Hai ballato fino alla chiusura. Domani non ti alzi.', { figo: 6 });
    },
  },
  {
    id: 'palestra',
    tab: 'uscite',
    emoji: '🏋️',
    titolo: 'Palestra',
    descrizione: 'Pesi, specchi e selfie. Aiuta anche in ginnastica.',
    energia: 30,
    soldi: 8,
    esegui: (s, rng) => {
      if (chance(rng, 0.35)) {
        const next = registraVoto(s, 'ginnastica', Math.min(10, s.voti.ginnastica + 2));
        return outcome(next, 'Allenamento top: il prof di ginnastica se n’è accorto.', { figo: 2 });
      }
      return outcome(s, 'Un’ora di pesi. Domani non alzi le braccia.', { figo: 2 });
    },
  },
  {
    id: 'lampada',
    tab: 'uscite',
    emoji: '🌞',
    titolo: 'Lampada abbronzante',
    descrizione: 'Abbronzatura da Maldive anche a febbraio.',
    energia: 5,
    soldi: 12,
    esegui: (s, rng) =>
      chance(rng, 0.15)
        ? outcome(s, 'Troppa lampada: sei color aragosta. Tutti ridono.', { figo: -2 })
        : outcome(s, `Abbronzat${o(s)} come dopo un mese a Ibiza.`, { figo: 3 }),
  },
  {
    id: 'social',
    tab: 'uscite',
    emoji: '🤳',
    titolo: 'Posta una storia',
    descrizione: 'Serve uno smartphone. Like assicurati (forse).',
    energia: 5,
    soldi: 0,
    bloccata: (s) => (hasSmartphone(s) ? null : 'Ti serve uno smartphone'),
    esegui: (s, rng) => {
      if (chance(rng, 0.15)) return outcome(s, 'Storia flop: tre visualizzazioni, una è tua madre.', { figo: -2 });
      if (chance(rng, 0.2)) return outcome(s, 'La storia esplode: cento like in un’ora!', { figo: 4 });
      return outcome(s, 'Storia postata. Un po’ di like, niente male.', { figo: 1 });
    },
  },
  // ---------------------------------------------------------------- Amore
  {
    id: 'scrivi_partner',
    tab: 'amore',
    emoji: '💬',
    titolo: 'Scrivi messaggi',
    descrizione: 'Cuoricini, vocali e buongiornissimo. Serve un telefono.',
    energia: 5,
    soldi: 1,
    bloccata: (s) => coppia(s, 'scrivi_partner') ?? (hasTelefono(s) ? null : 'Ti serve un telefono'),
    esegui: (s) => coccola(s, 'scrivi_partner', 6, 'chiacchierone', (p) => `Un’ora di messaggi con ${p.nome}. Credito finito, cuore pieno.`),
  },
  {
    id: 'pizza_partner',
    tab: 'amore',
    emoji: '🍕',
    titolo: 'Pizza insieme',
    descrizione: 'Margherita e patatine. Paghi tu, ovviamente.',
    energia: 20,
    soldi: 15,
    bloccata: (s) => coppia(s, 'pizza_partner'),
    esegui: (s) => coccola(s, 'pizza_partner', 12, 'festaiolo', (p) => `Pizza e passeggiata con ${p.nome}. Che serata.`, { figo: 1 }),
  },
  {
    id: 'cinema_partner',
    tab: 'amore',
    emoji: '🎬',
    titolo: 'Cinema',
    descrizione: 'Ultima fila, popcorn gigante.',
    energia: 15,
    soldi: 12,
    bloccata: (s) => coppia(s, 'cinema_partner'),
    esegui: (s) => coccola(s, 'cinema_partner', 10, 'romantico', (p) => `Film romantico con ${p.nome}. Del film non ricordate niente.`),
  },
  {
    id: 'giro_partner',
    tab: 'amore',
    emoji: '🛵',
    titolo: 'Giro in motorino',
    descrizione: 'In due sul motorino, il vento nei capelli.',
    energia: 10,
    soldi: 0,
    bloccata: (s) => coppia(s, 'giro_partner') ?? (motorinoFunziona(s) ? null : 'Serve un motorino che va'),
    esegui: (s) => {
      const m = s.motorino!;
      const conBenzina = { ...s, motorino: { ...m, benzina: Math.max(0, m.benzina - 10) } };
      return coccola(conBenzina, 'giro_partner', 12, 'motori', (p) => `Giro al lago con ${p.nome} dietro. Tutta la città vi ha visti.`, { figo: 2 });
    },
  },
  {
    id: 'regalo_partner',
    tab: 'amore',
    emoji: '🎁',
    titolo: 'Fai un regalo',
    descrizione: 'Un peluche gigante non sbaglia mai.',
    energia: 5,
    soldi: 25,
    bloccata: (s) => coppia(s, 'regalo_partner'),
    esegui: (s) => coccola(s, 'regalo_partner', 18, 'romantico', (p) => `${p.nome} ha adorato il peluche. Ti scrive “sei il top”.`),
  },
  {
    id: 'presenta_partner',
    tab: 'amore',
    emoji: '👯',
    titolo: 'Presenta alla compagnia',
    descrizione: 'Più è figo, più la compagnia ti rispetta. Una volta sola.',
    energia: 10,
    soldi: 0,
    bloccata: (s) => servePartner(s) ?? (s.partner!.presentato ? 'L’hai già presentato alla compagnia' : null),
    esegui: (s) => {
      const p = s.partner!;
      const next = { ...s, partner: { ...p, presentato: true, affetto: Math.min(100, p.affetto + 8) } };
      const bonus = Math.round(p.figo / 12);
      if (p.figo >= 60) return outcome(next, `La compagnia è a bocca aperta: “Ma come hai fatto con ${p.nome}?!”`, { figo: bonus });
      if (p.figo >= 35) return outcome(next, `${p.nome} piace a tutti. Approvazione della compagnia.`, { figo: bonus });
      return outcome(next, `La compagnia saluta ${p.nome} con educazione. E poi ridacchia.`, { figo: 1 });
    },
  },
  {
    id: 'lascia_partner',
    tab: 'amore',
    emoji: '💔',
    titolo: 'Chiudi la storia',
    descrizione: 'Con un vocale, come si fa oggi.',
    energia: 0,
    soldi: 0,
    bloccata: servePartner,
    esegui: (s) => {
      const p = s.partner!;
      const next = { ...s, partner: null, exPartners: s.exPartners + 1 };
      return outcome(next, `Hai mollato ${p.nome} con un vocale di 4 minuti. Spietat${o(s)}.`, { figo: 1 });
    },
  },

  // ---------------------------------------------------------------- Lavoro
  {
    id: 'cerca_lavoro',
    tab: 'lavoro',
    emoji: '📋',
    titolo: 'Cerca un lavoro fisso',
    descrizione: 'Giri i negozi col curriculum. Look e voti aiutano.',
    energia: 15,
    soldi: 0,
    bloccata: (s) => (s.lavoro ? 'Un lavoro ce l’hai già' : null),
    esegui: (s, rng) => {
      if (chance(rng, 0.2 + figosita(s) / 300 + s.studio / 400)) {
        const job = pick(LAVORI, rng);
        // Puoi fare il primo turno già oggi.
        const next = { ...s, lavoro: { id: job.id, ultimoTurno: s.day - 1 } };
        return outcome(next, `${g(s, 'Assunto', 'Assunta')} da ${job.nome}! Paga: ${job.paga}€ a turno.`);
      }
      return outcome(s, '“Le faremo sapere.” Classico.', { figo: -1 });
    },
  },
  {
    id: 'turno',
    tab: 'lavoro',
    emoji: '⏱️',
    titolo: 'Fai il turno al lavoro',
    descrizione: 'Se non ti presenti per una settimana, ti licenziano.',
    energia: 40,
    soldi: 0,
    bloccata: (s) =>
      !s.lavoro ? 'Prima trovati un lavoro fisso' : s.lavoro.ultimoTurno === s.day ? 'Il turno di oggi è fatto' : null,
    esegui: (s, rng) => {
      const job = LAVORI_BY_ID[s.lavoro!.id];
      const next = { ...s, lavoro: { ...s.lavoro!, ultimoTurno: s.day } };
      const mancia = chance(rng, 0.25) ? 8 : 0;
      const text = mancia
        ? `Turno da ${job.nome}: ${job.paga}€ più ${mancia}€ di mancia!`
        : `Turno da ${job.nome}: ${job.paga}€ guadagnati col sudore.`;
      return outcome(next, text, { soldi: job.paga + mancia, figo: job.figo });
    },
  },
  {
    id: 'licenziati',
    tab: 'lavoro',
    emoji: '🚪',
    titolo: 'Licenziati',
    descrizione: 'Basta, meriti di meglio.',
    energia: 0,
    soldi: 0,
    bloccata: (s) => (s.lavoro ? null : 'Non hai un lavoro fisso'),
    esegui: (s) => {
      const job = LAVORI_BY_ID[s.lavoro!.id];
      return outcome({ ...s, lavoro: null }, `Ti sei licenziat${o(s)} da ${job.nome}. Libertà!`, { figo: 1 });
    },
  },
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
