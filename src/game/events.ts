import { isSchoolDay } from './calendar';
import { chance, figosita, outcome } from './state';
import { GameEvent } from './types';

export const EVENTS: GameEvent[] = [
  {
    id: 'verifica',
    emoji: '📝',
    titolo: 'Verifica a sorpresa!',
    testo: () => 'La prof di mate entra con un sorrisetto: “Fogli protocollo sul banco.”',
    peso: 3,
    condizione: (s) => isSchoolDay(s.day),
    scelte: [
      {
        label: 'Ce la faccio da solo',
        esito: (s, rng) =>
          chance(rng, s.studio / 100)
            ? outcome(s, 'Sette e mezzo! Sei un genio incompreso.', { studio: 4, genitori: 8 })
            : outcome(s, 'Quattro. La prof scuote la testa.', { studio: -2, genitori: -8 }),
      },
      {
        label: 'Copio dal secchione',
        esito: (s, rng) =>
          chance(rng, 0.6)
            ? outcome(s, 'Copiato tutto, persino il nome. Ma la prof non se n’è accorta: sei.', { genitori: 3 })
            : outcome(s, 'Beccato a copiare! Compito ritirato e nota.', { genitori: -15, figo: 2 }),
      },
    ],
  },
  {
    id: 'nonna',
    emoji: '👵',
    titolo: 'Pranzo dalla nonna',
    testo: () => 'La nonna ti stringe le guance: “Come sei sciupato! Tieni, comprati qualcosa.”',
    peso: 2,
    scelte: [
      { label: 'Grazie nonna! ❤️', esito: (s) => outcome(s, 'La nonna ti ha dato 30€ e tre chili di lasagne.', { soldi: 30, energia: 20 }) },
    ],
  },
  {
    id: 'soldi_terra',
    emoji: '💶',
    titolo: 'Banconota per terra',
    testo: () => 'Davanti al bar c’è una banconota da 10€ che svolazza.',
    peso: 2,
    scelte: [
      { label: 'La prendo', esito: (s) => outcome(s, 'Dieci euro gratis. Oggi è il tuo giorno.', { soldi: 10 }) },
      {
        label: 'La porto al barista',
        esito: (s, rng) =>
          chance(rng, 0.5)
            ? outcome(s, 'Il barista ti offre un energy drink per l’onestà.', { energia: 25, genitori: 3 })
            : outcome(s, 'Il barista se la mette in tasca. Mah.', { genitori: 2 }),
      },
    ],
  },
  {
    id: 'motorino_non_parte',
    emoji: '🛵',
    titolo: 'Il motorino non parte',
    testo: () => 'Giri la chiave, spingi la pedalina… niente. Tossisce e muore.',
    peso: 3,
    condizione: (s) => !!s.motorino && s.motorino.condizione < 60,
    scelte: [
      {
        label: 'Meccanico (25€)',
        esito: (s) =>
          s.soldi >= 25
            ? outcome({ ...s, motorino: { ...s.motorino!, condizione: Math.min(100, s.motorino!.condizione + 30) } }, 'Il meccanico l’ha rimesso in sesto.', { soldi: -25 })
            : outcome(s, 'Non hai i soldi. Te lo fai a spinta fino a casa.', { energia: -20, figo: -2 }),
      },
      { label: 'Lo spingo fino a casa', esito: (s) => outcome(s, 'Venti minuti a spingere sotto gli sguardi di tutti.', { energia: -20, figo: -3 }) },
    ],
  },
  {
    id: 'vigile',
    emoji: '👮',
    titolo: 'Posto di blocco',
    testo: () => 'Un vigile ti ferma: “Questo motorino fa un po’ troppo rumore, o sbaglio?”',
    peso: 3,
    condizione: (s) => !!s.motorino?.truccato,
    scelte: [
      { label: 'Pago la multa (80€)', esito: (s) => outcome(s, 'Multa da 80€. E il vigile ti ha pure fatto la predica.', { soldi: -80, genitori: -5 }) },
      {
        label: 'Faccio il simpatico',
        esito: (s, rng) =>
          chance(rng, figosita(s) / 150)
            ? outcome(s, 'Il vigile ride e ti lascia andare. Carisma puro.', { figo: 3 })
            : outcome({ ...s, motorino: { ...s.motorino!, truccato: false } }, 'Il vigile non ride. Multa e marmitta sequestrata.', { soldi: -80, genitori: -10 }),
      },
    ],
  },
  {
    id: 'festa',
    emoji: '🎉',
    titolo: 'Festa a casa di Ludo',
    testo: () => 'Ti arriva un messaggio: “Stasera festa da me, genitori via. Vieni?”',
    peso: 2,
    condizione: (s) => figosita(s) >= 30,
    scelte: [
      { label: 'Certo che vengo', esito: (s) => outcome(s, 'Festa epica. Sei rientrato alle 3 e nessuno l’ha saputo.', { figo: 7, energia: -30 }) },
      { label: 'Resto a casa', esito: (s) => outcome(s, 'Serata in pigiama. Domani tutti parleranno della festa.', { energia: 10, figo: -2 }) },
    ],
  },
  {
    id: 'diario',
    emoji: '📒',
    titolo: 'Controllo del diario',
    testo: () => 'Tuo padre si siede sul divano: “Fammi vedere il diario.”',
    peso: 2,
    scelte: [
      {
        label: 'Ecco qui…',
        esito: (s) =>
          s.studio >= 55
            ? outcome(s, '“Bravo, continua così.” Papà è soddisfatto.', { genitori: 10 })
            : outcome(s, '“E queste note?!” Punizione: niente uscite fino a domani.', { genitori: -12, energia: -15 }),
      },
      {
        label: 'L’ho dimenticato a scuola',
        esito: (s, rng) =>
          chance(rng, 0.4)
            ? outcome(s, 'Ha funzionato. Per stavolta.', { figo: 1 })
            : outcome(s, 'Il diario sbuca dallo zaino. Doppia punizione.', { genitori: -18 }),
      },
    ],
  },
  {
    id: 'sfida_ballo',
    emoji: '🕺',
    titolo: 'Sfida di ballo in piazza',
    testo: () => 'La compagnia ti sfida a un balletto davanti a tutti, da postare sui social.',
    peso: 2,
    scelte: [
      {
        label: 'Accetto la sfida',
        esito: (s, rng) =>
          chance(rng, 0.35 + figosita(s) / 200)
            ? outcome(s, 'Il video fa 2.000 visualizzazioni. Sei virale (nel quartiere).', { figo: 8 })
            : outcome(s, 'Sei inciampato sul più bello. Il video gira in tutte le chat.', { figo: -5 }),
      },
      { label: 'Neanche morto', esito: (s) => outcome(s, '“Che noia che sei.” Ti danno del matusa.', { figo: -2 }) },
    ],
  },
  {
    id: 'partner_gelosia',
    emoji: '😤',
    titolo: 'Scenata di gelosia',
    testo: (s) => `${s.partner?.nome} ha visto che hai messo like a una foto. “Chi è quella persona?!”`,
    peso: 2,
    condizione: (s) => !!s.partner,
    scelte: [
      {
        label: 'Chiedo scusa',
        esito: (s) => outcome({ ...s, partner: { ...s.partner!, affetto: Math.min(100, s.partner!.affetto + 5) } }, 'Scuse accettate. Per ora.', { figo: -1 }),
      },
      {
        label: 'Era solo un like!',
        esito: (s) => outcome({ ...s, partner: { ...s.partner!, affetto: Math.max(0, s.partner!.affetto - 20) } }, 'Non ti parla per tutta la sera.'),
      },
    ],
  },
  {
    id: 'partner_anniversario',
    emoji: '💝',
    titolo: 'Un mese insieme!',
    testo: (s) => `${s.partner?.nome} ti ricorda che oggi è il vostro “mesiversario”.`,
    peso: 4,
    condizione: (s) => !!s.partner && s.partner.giorni >= 28 && s.partner.giorni <= 34,
    scelte: [
      {
        label: 'Regalo a sorpresa (20€)',
        esito: (s) =>
          s.soldi >= 20
            ? outcome({ ...s, partner: { ...s.partner!, affetto: 100 } }, 'Cuore di peluche e cioccolatini. Successo totale.', { soldi: -20, figo: 3 })
            : outcome({ ...s, partner: { ...s.partner!, affetto: Math.max(0, s.partner!.affetto - 15) } }, 'Non avevi un euro. Figuraccia.'),
      },
      {
        label: 'Me n’ero dimenticato…',
        esito: (s) => outcome({ ...s, partner: { ...s.partner!, affetto: Math.max(0, s.partner!.affetto - 30) } }, 'Gelo totale. Ti conviene rimediare.'),
      },
    ],
  },
  {
    id: 'influencer',
    emoji: '🤳',
    titolo: 'L’influencer del quartiere',
    testo: () => 'Il tipo con 10k follower ti ferma: “Bel fit! Ti faccio una storia?”',
    peso: 1,
    condizione: (s) => figosita(s) >= 50,
    scelte: [
      { label: 'Vai, taggami!', esito: (s) => outcome(s, 'Cento nuovi follower in un’ora. Ora sei un VIP.', { figo: 10 }) },
    ],
  },
  {
    id: 'rissa',
    emoji: '🥊',
    titolo: 'Brutta aria al parchetto',
    testo: () => 'Quelli del quartiere vicino vogliono il tuo posto sulla panchina.',
    peso: 2,
    scelte: [
      {
        label: 'Tengo il punto',
        esito: (s, rng) =>
          chance(rng, 0.5)
            ? outcome(s, 'Se ne vanno borbottando. La panchina è vostra.', { figo: 5 })
            : outcome(s, 'Volano spintoni, perdi il cappellino e la dignità.', { figo: -4, energia: -20 }),
      },
      { label: 'Cambiamo panchina', esito: (s) => outcome(s, 'Panchina nuova, stessa compagnia. Pace.', { figo: -1 }) },
    ],
  },
];

export const EVENTS_BY_ID: Record<string, GameEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
