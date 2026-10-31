import { isSchoolDay, isWeekend } from './calendar';
import { itemsByCategory, LAVORI_BY_ID } from './items';
import {
  chance,
  figosita,
  g,
  hasTelefono,
  materiaDelGiorno,
  motorinoFunziona,
  o,
  outcome,
  randomPartnerName,
  registraVoto,
  votoInterrogazione,
} from './state';
import { GameEvent, GameState, Item } from './types';

const conAffetto = (s: GameState, delta: number): GameState => ({
  ...s,
  partner: { ...s.partner!, affetto: Math.max(0, Math.min(100, s.partner!.affetto + delta)) },
});

/** Il capo in saldo è fisso per giorno, così testo ed esito parlano dello stesso oggetto. */
function articoloInSaldo(s: GameState): Item | null {
  const disponibili = [...itemsByCategory('vestiti'), ...itemsByCategory('accessori')].filter(
    (i) => !s.inventario.includes(i.id) && i.prezzo >= 20,
  );
  return disponibili.length ? disponibili[s.day % disponibili.length] : null;
}

const prezzoSaldo = (i: Item) => Math.ceil(i.prezzo / 2);

export const EVENTS: GameEvent[] = [
  // ---------------------------------------------------------------- Scuola
  {
    id: 'interrogazione',
    emoji: '🙋',
    titolo: 'Interrogazione!',
    testo: (s) => {
      const m = materiaDelGiorno(s.day);
      return `Il prof di ${m.nome.toLowerCase()} scorre il registro… e si ferma sul tuo nome. ${m.emoji}`;
    },
    peso: 5,
    dopo: ['scuola_segui', 'scuola_dormi'],
    condizione: (s) => isSchoolDay(s.day),
    scelte: [
      {
        label: 'Vado alla lavagna',
        esito: (s, rng) => {
          const m = materiaDelGiorno(s.day);
          const voto = votoInterrogazione(s, rng);
          const next = registraVoto(s, m.id, voto);
          if (voto >= 6) return outcome(next, `${voto} in ${m.nome}! Te la sei cavata alla grande.`, { genitori: 4 });
          return outcome(next, `${voto} in ${m.nome}. Scena muta, o quasi.`, { genitori: -6 });
        },
      },
      {
        label: 'Sto male, prof…',
        esito: (s, rng) => {
          const m = materiaDelGiorno(s.day);
          if (chance(rng, 0.4)) return outcome(s, '“Va bene, ti interrogo la prossima volta.” Salvezza!');
          return outcome(registraVoto(s, m.id, 3), `“Non ci credo.” Tre in ${m.nome}.`, { genitori: -8 });
        },
      },
    ],
  },
  {
    id: 'verifica',
    emoji: '📝',
    titolo: 'Verifica a sorpresa!',
    testo: () => 'La prof di mate entra con un sorrisetto: “Fogli protocollo sul banco.”',
    peso: 3,
    dopo: ['scuola_segui', 'scuola_dormi'],
    condizione: (s) => isSchoolDay(s.day),
    scelte: [
      {
        label: 'Faccio da me',
        esito: (s, rng) => {
          const voto = votoInterrogazione(s, rng);
          const next = registraVoto(s, 'matematica', voto);
          return voto >= 6
            ? outcome(next, `${voto} nella verifica! Sei un genio incompreso.`, { studio: 2, genitori: 6 })
            : outcome(next, `${voto} nella verifica. La prof scuote la testa.`, { genitori: -6 });
        },
      },
      {
        label: 'Copio dal secchione',
        esito: (s, rng) =>
          chance(rng, 0.6)
            ? outcome(registraVoto(s, 'matematica', 6), 'Copiato tutto, persino il nome. Ma la prof non se n’è accorta: sei.')
            : outcome(registraVoto(s, 'matematica', 2), `Beccat${o(s)} a copiare! Due e nota.`, { genitori: -15, figo: 2 }),
      },
    ],
  },
  {
    id: 'gita',
    emoji: '🚌',
    titolo: 'Gita scolastica',
    testo: () => 'La classe va in gita a Firenze. Costa 50€, ma tre giorni senza genitori…',
    peso: 1,
    condizione: (s) => isSchoolDay(s.day),
    scelte: [
      {
        label: 'Ci vado (50€)',
        esito: (s) =>
          s.soldi >= 50
            ? outcome(s, 'Gita leggendaria: notte in bianco in albergo e foto di gruppo epiche.', {
                soldi: -50,
                figo: 8,
                energia: -30,
              })
            : outcome(s, 'Non hai i soldi. Resti a scuola con i tre che non sono partiti.', { figo: -3 }),
      },
      { label: 'Resto a casa', esito: (s) => outcome(s, 'Tre giorni di classe vuota. Almeno hai studiato.', { studio: 4, figo: -2 }) },
    ],
  },
  {
    id: 'sciopero',
    emoji: '📣',
    titolo: 'Sciopero studentesco',
    testo: () => 'Davanti a scuola ci sono striscioni e un megafono. Oggi si sciopera!',
    peso: 1,
    condizione: (s) => isSchoolDay(s.day),
    scelte: [
      { label: 'Vado al corteo', esito: (s) => outcome(s, 'Cori, striscioni e una foto sul giornale locale.', { figo: 5, genitori: -3 }) },
      { label: 'Entro in classe', esito: (s) => outcome(s, 'In classe siete in quattro. Il prof spiega lo stesso.', { studio: 3, figo: -2 }) },
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
            ? outcome(s, `“${g(s, 'Bravo', 'Brava')}, continua così.” Papà è soddisfatto.`, { genitori: 10 })
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

  // ---------------------------------------------------------------- Famiglia e soldi
  {
    id: 'nonna',
    emoji: '👵',
    titolo: 'Pranzo dalla nonna',
    testo: (s) => `La nonna ti stringe le guance: “Come sei sciupat${o(s)}! Tieni, comprati qualcosa.”`,
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
    dopo: ['uscite'],
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
    id: 'saldi',
    emoji: '🏷️',
    titolo: 'Saldi al centro commerciale',
    testo: (s) => {
      const i = articoloInSaldo(s)!;
      return `${i.emoji} ${i.nome} a metà prezzo: solo ${prezzoSaldo(i)}€ invece di ${i.prezzo}€!`;
    },
    peso: 2,
    dopo: ['piazzetta'],
    condizione: (s) => !!articoloInSaldo(s),
    scelte: [
      {
        label: 'Lo prendo!',
        esito: (s) => {
          const i = articoloInSaldo(s)!;
          if (s.soldi < prezzoSaldo(i)) return outcome(s, 'Al momento di pagare, il portafoglio piange. Niente da fare.');
          return outcome({ ...s, inventario: [...s.inventario, i.id] }, `Affare fatto: ${i.nome} a ${prezzoSaldo(i)}€.`, {
            soldi: -prezzoSaldo(i),
          });
        },
      },
      { label: 'Non mi serve', esito: (s) => outcome(s, 'Resisti alla tentazione. Il portafoglio ringrazia.') },
    ],
  },
  {
    id: 'compleanno_amico',
    emoji: '🎂',
    titolo: 'Compleanno in compagnia',
    testo: () => 'Stasera si festeggia il compleanno del Bomber. Tutti mettono 15€ per il regalo.',
    peso: 2,
    scelte: [
      {
        label: 'Metto i 15€',
        esito: (s) =>
          s.soldi >= 15
            ? outcome(s, 'Regalo di gruppo azzeccato. Il Bomber ti abbraccia commosso.', { soldi: -15, figo: 3 })
            : outcome(s, 'Non li hai. Fai finta di aver già pagato. Nessuno ci crede.', { figo: -4 }),
      },
      { label: 'Sono al verde', esito: (s) => outcome(s, `“${g(s, 'Il solito tirchio', 'La solita tirchia')}.” Ti guardano storto tutta la sera.`, { figo: -3 }) },
    ],
  },
  {
    id: 'telefono_caduto',
    emoji: '📵',
    titolo: 'Telefono per terra',
    testo: () => 'Ti scivola il telefono dalla tasca. Crack. Lo schermo è una ragnatela.',
    peso: 2,
    dopo: ['uscite'],
    condizione: hasTelefono,
    scelte: [
      {
        label: 'Lo faccio riparare (40€)',
        esito: (s) =>
          s.soldi >= 40
            ? outcome(s, 'Schermo nuovo. Questa volta compri anche la pellicola.', { soldi: -40 })
            : outcome(s, 'Non hai i soldi. Te lo tieni crepato.', { figo: -3 }),
      },
      { label: 'Lo tengo così', esito: (s) => outcome(s, 'Schermo crepato: fa molto vissuto. O molto sfigato.', { figo: -2 }) },
    ],
  },

  // ---------------------------------------------------------------- Uscite
  {
    id: 'festa',
    emoji: '🎉',
    titolo: 'Festa a casa di Ludo',
    testo: () => 'Ti arriva un messaggio: “Stasera festa da me, genitori via. Vieni?”',
    peso: 2,
    condizione: (s) => figosita(s) >= 30,
    scelte: [
      { label: 'Certo che vengo', esito: (s) => outcome(s, `Festa epica. Sei rientrat${o(s)} alle 3 e nessuno l’ha saputo.`, { figo: 7, energia: -30 }) },
      { label: 'Resto a casa', esito: (s) => outcome(s, 'Serata in pigiama. Domani tutti parleranno della festa.', { energia: 10, figo: -2 }) },
    ],
  },
  {
    id: 'concerto',
    emoji: '🎤',
    titolo: 'Concerto in piazza',
    testo: () => 'Stasera suona gratis il trapper del quartiere. Sotto il palco c’è già mezza scuola.',
    peso: 2,
    condizione: (s) => isWeekend(s.day),
    scelte: [
      { label: 'Sotto il palco!', esito: (s) => outcome(s, 'Hai urlato tutti i testi. Domani niente voce, ma che serata.', { figo: 5, energia: -20 }) },
      { label: 'Lo guardo in diretta', esito: (s) => outcome(s, 'Lo vedi dal telefono. Non è la stessa cosa.', { figo: -1 }) },
    ],
  },
  {
    id: 'sfida_ballo',
    emoji: '🕺',
    titolo: 'Sfida di ballo in piazza',
    testo: () => 'La compagnia ti sfida a un balletto davanti a tutti, da postare sui social.',
    peso: 2,
    dopo: ['piazzetta', 'disco'],
    scelte: [
      {
        label: 'Accetto la sfida',
        esito: (s, rng) =>
          chance(rng, 0.35 + figosita(s) / 200)
            ? outcome(s, 'Il video fa 2.000 visualizzazioni. Sei virale (nel quartiere).', { figo: 8 })
            : outcome(s, `Sei inciampat${o(s)} sul più bello. Il video gira in tutte le chat.`, { figo: -5 }),
      },
      { label: 'Neanche per sogno', esito: (s) => outcome(s, '“Che noia che sei.” Ti danno del matusa.', { figo: -2 }) },
    ],
  },
  {
    id: 'influencer',
    emoji: '🤳',
    titolo: 'L’influencer del quartiere',
    testo: () => 'Quello con 10k follower ti ferma: “Bel fit! Ti faccio una storia?”',
    peso: 1,
    dopo: ['piazzetta', 'social'],
    condizione: (s) => figosita(s) >= 50,
    scelte: [{ label: 'Vai, taggami!', esito: (s) => outcome(s, 'Cento nuovi follower in un’ora. Ora sei VIP.', { figo: 10 }) }],
  },
  {
    id: 'rissa',
    emoji: '🥊',
    titolo: 'Brutta aria al parchetto',
    testo: () => 'Quelli del quartiere vicino vogliono il tuo posto sulla panchina.',
    peso: 2,
    dopo: ['piazzetta', 'sala_giochi'],
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

  // ---------------------------------------------------------------- Motorino
  {
    id: 'motorino_non_parte',
    emoji: '🛵',
    titolo: 'Il motorino non parte',
    testo: () => 'Giri la chiave, spingi la pedalina… niente. Tossisce e muore.',
    peso: 3,
    dopo: ['uscite', 'lavoro'],
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
    dopo: ['uscite'],
    condizione: (s) => !!s.motorino?.truccato,
    scelte: [
      { label: 'Pago la multa (80€)', esito: (s) => outcome(s, 'Multa da 80€. E il vigile ti ha pure fatto la predica.', { soldi: -80, genitori: -5 }) },
      {
        label: (s) => `Faccio ${g(s, 'il simpatico', 'la simpatica')}`,
        esito: (s, rng) =>
          chance(rng, figosita(s) / 150)
            ? outcome(s, 'Il vigile ride e ti lascia andare. Carisma puro.', { figo: 3 })
            : outcome({ ...s, motorino: { ...s.motorino!, truccato: false } }, 'Il vigile non ride. Multa e marmitta sequestrata.', { soldi: -80, genitori: -10 }),
      },
    ],
  },
  {
    id: 'cugino_motorino',
    emoji: '🧑‍🔧',
    titolo: 'Il motorino del cugino',
    testo: () => 'Tuo cugino vende il suo vecchio scooter: “A te lo lascio a 150€, è un affare.”',
    peso: 1,
    condizione: (s) => !s.motorino,
    scelte: [
      {
        label: 'Affare fatto (150€)',
        esito: (s) =>
          s.soldi >= 150
            ? outcome({ ...s, motorino: { id: 'scooter_rotto', condizione: 45, truccato: false, benzina: 30 } }, 'Ora hai un motorino! Un po’ acciaccato, ma è tuo. 🛵', { soldi: -150 })
            : outcome(s, '“Torna quando hai i soldi.” Il cugino non fa sconti.'),
      },
      { label: 'No grazie', esito: (s) => outcome(s, 'Lo compra il vicino. Lo vedrai passare ogni giorno.', { figo: -1 }) },
    ],
  },
  {
    id: 'raduno',
    emoji: '🏁',
    titolo: 'Raduno di motorini',
    testo: () => 'Sabato in piazza c’è il raduno: tutti mettono in mostra lo scooter.',
    peso: 2,
    condizione: (s) => motorinoFunziona(s),
    scelte: [
      {
        label: 'Porto il mio',
        esito: (s) =>
          s.motorino!.truccato || s.motorino!.id !== 'scooter_rotto'
            ? outcome(s, 'Il tuo scooter fa girare tutte le teste. Re del raduno!', { figo: 6 })
            : outcome(s, 'Il tuo scooter fa un po’ pena accanto agli altri. Però c’eri.', { figo: 1 }),
      },
      { label: 'Resto a guardare', esito: (s) => outcome(s, 'Guardi gli altri scooter e sogni.') },
    ],
  },

  // ---------------------------------------------------------------- Amore
  {
    id: 'partner_gelosia',
    emoji: '😤',
    titolo: 'Scenata di gelosia',
    testo: (s) => `${s.partner?.nome} ha visto che hai messo like a una foto. “E questa persona chi è?!”`,
    peso: 2,
    dopo: ['social', 'chatta_partner', 'disco'],
    condizione: (s) => !!s.partner,
    scelte: [
      { label: 'Chiedo scusa', esito: (s) => outcome(conAffetto(s, 5), 'Scuse accettate. Per ora.', { figo: -1 }) },
      { label: 'Era solo un like!', esito: (s) => outcome(conAffetto(s, -20), 'Non ti parla per tutta la sera.') },
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
            ? outcome(conAffetto(s, 100), 'Cuore di peluche e cioccolatini. Successo totale.', { soldi: -20, figo: 3 })
            : outcome(conAffetto(s, -15), 'Non avevi un euro. Figuraccia.'),
      },
      {
        label: (s) => `Me n’ero ${g(s, 'dimenticato', 'dimenticata')}…`,
        esito: (s) => outcome(conAffetto(s, -30), 'Gelo totale. Ti conviene rimediare.'),
      },
    ],
  },
  {
    id: 'partner_genitori',
    emoji: '🍝',
    titolo: 'Cena con i suoceri',
    testo: (s) => `${s.partner?.nome} vuole presentarti ai suoi genitori. Domenica, pranzo, tutti a tavola.`,
    peso: 2,
    condizione: (s) => !!s.partner && s.partner.giorni >= 10,
    scelte: [
      {
        label: 'Ci vado in camicia',
        esito: (s, rng) =>
          chance(rng, 0.6)
            ? outcome(conAffetto(s, 20), `Hai fatto colpo: “Che ${g(s, 'ragazzo', 'ragazza')} a modo!”`, { genitori: 3 })
            : outcome(conAffetto(s, -10), 'Hai rovesciato il ragù sulla tovaglia buona. Silenzio di tomba.'),
      },
      { label: 'Invento una scusa', esito: (s) => outcome(conAffetto(s, -15), '“Non ti interesso abbastanza.” Ti tiene il muso tutta la settimana.') },
    ],
  },
  {
    id: 'ex_ritorna',
    emoji: '📲',
    titolo: 'Ritorno di fiamma',
    testo: () => 'Un messaggio a mezzanotte da una vecchia fiamma: “Mi manchi… ci vediamo?”',
    peso: 1,
    condizione: (s) => !s.partner && s.exPartners > 0,
    scelte: [
      {
        label: 'Ci riproviamo',
        esito: (s, rng) => {
          const nome = randomPartnerName(s.preferenza, rng);
          return outcome({ ...s, partner: { nome, affetto: 50, giorni: 0 } }, `Tu e ${nome} tornate insieme. Minestra riscaldata, ma buona.`, {
            figo: 2,
          });
        },
      },
      { label: 'Visualizza e ignora', esito: (s) => outcome(s, 'Doppia spunta blu e silenzio. Glaciale.', { figo: 3 }) },
    ],
  },

  // ---------------------------------------------------------------- Lavoro
  {
    id: 'capo_extra',
    emoji: '🧑‍💼',
    titolo: 'Turno extra',
    testo: (s) => `Ti chiama il capo di ${LAVORI_BY_ID[s.lavoro!.id].nome}: “Mi manca gente, domani puoi fare un turno doppio?”`,
    peso: 2,
    dopo: ['turno'],
    condizione: (s) => !!s.lavoro,
    scelte: [
      {
        label: 'Ci sto',
        esito: (s) => {
          const job = LAVORI_BY_ID[s.lavoro!.id];
          return outcome({ ...s, lavoro: { ...s.lavoro!, ultimoTurno: s.day } }, `Turno doppio: ${job.paga * 2}€, ma sei distrutt${o(s)}.`, {
            soldi: job.paga * 2,
            energia: -50,
          });
        },
      },
      {
        label: 'Non posso',
        esito: (s, rng) =>
          chance(rng, 0.2)
            ? outcome({ ...s, lavoro: null }, '“Allora non serve che torni.” Licenziamento in tronco!', { figo: -2 })
            : outcome(s, '“Va bene, sarà per un’altra volta.”'),
      },
    ],
  },

  // ---------------------------------------------------------------- Solo di giorno
  {
    id: 'prof_telefono',
    emoji: '📵',
    titolo: 'Beccato col telefono',
    testo: () => 'Il prof si ferma accanto al tuo banco: “Cos’hai lì sotto?” Il telefono è ancora acceso.',
    peso: 3,
    dopo: ['scuola_segui', 'scuola_dormi'],
    soloGiorno: true,
    condizione: hasTelefono,
    scelte: [
      { label: 'Lo consegno', esito: (s) => outcome(s, 'Telefono sequestrato fino all’ultima ora. Che agonia.', { genitori: -2 }) },
      {
        label: 'È la calcolatrice!',
        esito: (s, rng) =>
          chance(rng, 0.3)
            ? outcome(s, 'Il prof ci crede. La classe trattiene le risate.', { figo: 3 })
            : outcome(s, '“Una calcolatrice con le storie?” Nota sul registro.', { genitori: -10, figo: 1 }),
      },
    ],
  },
  {
    id: 'cliente_furioso',
    emoji: '😡',
    titolo: 'Cliente furioso',
    testo: () => 'Un cliente sbraita: “È mezz’ora che aspetto! Voglio parlare col responsabile!”',
    peso: 3,
    dopo: ['turno'],
    soloGiorno: true,
    condizione: (s) => !!s.lavoro,
    scelte: [
      {
        label: 'Sorrido e chiedo scusa',
        esito: (s, rng) =>
          chance(rng, 0.5)
            ? outcome(s, 'Si calma e ti lascia pure 5€ di mancia. Professionalità.', { soldi: 5 })
            : outcome(s, 'Se ne va lo stesso sbattendo la porta. Pazienza.', { energia: -10 }),
      },
      {
        label: 'Gli rispondo per le rime',
        esito: (s, rng) =>
          chance(rng, 0.4)
            ? outcome({ ...s, lavoro: null }, `Il capo ha sentito tutto. Sei ${g(s, 'licenziato', 'licenziata')}!`, { figo: 2 })
            : outcome(s, 'I colleghi ti applaudono di nascosto. Leggenda.', { figo: 4 }),
      },
    ],
  },
  {
    id: 'prive',
    emoji: '🥂',
    titolo: 'Invito nel privé',
    testo: () => 'Il PR della disco ti indica: “Tu, sì, tu. Vieni nel privé.”',
    peso: 3,
    dopo: ['disco'],
    soloGiorno: true,
    condizione: (s) => figosita(s) >= 40,
    scelte: [
      { label: 'Andiamo!', esito: (s) => outcome(s, 'Divanetti, luci e la gente che ti guarda da sotto. Serata da VIP.', { figo: 6, energia: -10 }) },
      { label: 'Resto con la compagnia', esito: (s) => outcome(s, 'La compagnia apprezza: “Tu sì che sei vero.”', { figo: 2 }) },
    ],
  },
  {
    id: 'prestito',
    emoji: '🤝',
    titolo: 'Il Bomber chiede un prestito',
    testo: () => '“Fratè, mi presti 20€? Te li ridò sabato, giuro.”',
    peso: 2,
    dopo: ['piazzetta', 'sala_giochi'],
    soloGiorno: true,
    scelte: [
      {
        label: 'Ecco i 20€',
        esito: (s, rng) => {
          if (s.soldi < 20) return outcome(s, 'Non li hai nemmeno tu. Vi guardate e ridete.');
          return chance(rng, 0.5)
            ? outcome(s, 'Miracolo: te li ridà subito, con un gelato di interessi.', { energia: 10, figo: 2 })
            : outcome(s, 'I 20€ spariscono nel nulla. Ma il Bomber ora ti deve un favore.', { soldi: -20, figo: 3 });
        },
      },
      { label: 'Sono al verde', esito: (s) => outcome(s, '“Va be’, chiedo a un altro.” Un po’ di gelo.', { figo: -1 }) },
    ],
  },
];

export const EVENTS_BY_ID: Record<string, GameEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function choiceLabel(c: GameEvent['scelte'][number], s: GameState): string {
  return typeof c.label === 'function' ? c.label(s) : c.label;
}
