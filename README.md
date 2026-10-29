# Giargia Simulator 😎🛵

Un anno scolastico per diventare il più figo del quartiere. Gioco mobile per iOS e Android fatto con Expo (React Native + TypeScript).

## Come si gioca

- Scegli nome, se sei un giargia o una giargia, e chi ti piace.
- Ogni giorno hai **energia** da spendere: scuola, uscite, lavoro.
- I giorni feriali scegli cosa fare a scuola. Se non scegli niente, prendi un'assenza. Durante feste e vacanze non c'è scuola.
- Sei materie con i voti sul **registro**: arrivano con interrogazioni e verifiche, e dipendono da quanto studi.
- Compra vestiti, accessori, telefoni e motorini per alzare la **figosità**. Il motorino va riparato e ha bisogno di benzina.
- Trova qualcuno con cui metterti insieme, e non trascurarlo, altrimenti ti molla. Con il telefono puoi scrivergli.
- Lavoretti al volo o un **lavoro fisso**, che paga di più ma va fatto almeno una volta a settimana.
- Il lunedì arriva la paghetta, a Natale i regali dei parenti, a fine gennaio la pagella del quadrimestre.
- La notte possono capitare **eventi casuali** con scelte da fare.
- A giugno arriva la pagella finale: promosso, con debito o bocciato. Oltre 50 assenze si boccia.

## Provarlo sul telefono

1. Installa **Expo Go** sull'iPhone (App Store).
2. Sul computer:

```bash
npm install
```

```bash
npx expo start
```

3. Inquadra il QR code con la fotocamera dell'iPhone.

Per vederlo nel browser: `npx expo start --web`.

## Sviluppo

```bash
npm test
```

```bash
npm run typecheck
```

La struttura del codice:

- `src/game/`: logica del gioco, pura e testata (azioni, eventi, oggetti, calendario, motore).
- `src/ui/`: schermate e componenti.
- `App.tsx`: punto di ingresso.

Per aggiungere contenuti basta modificare `src/game/actions.ts`, `src/game/events.ts` e `src/game/items.ts`.

## Pubblicare sull'App Store

Serve un account Apple Developer (99 $/anno). La build si fa nel cloud con EAS, senza Mac:

```bash
npx eas-cli build --platform ios
```

```bash
npx eas-cli submit --platform ios
```

L'identificativo dell'app è `com.giargiasimulator.app`, sia su iOS che su Android. Dopo il primo caricamento sugli store non si può più cambiare.

Build e numeri di versione sono configurati in `eas.json`: EAS incrementa da solo il numero di build a ogni build di produzione.

## Icone

Le icone sono disegnate da zero. I sorgenti modificabili sono in `assets/source/` (SVG), i PNG usati dall'app in `assets/`:

- `icon.png`: icona iOS, 1024×1024, senza trasparenza;
- `android-icon-*.png`: icona adattiva Android (primo piano, sfondo, monocromatica);
- `splash-icon.png`: schermata di avvio;
- `favicon.png`: versione web.

## Note

Gioco originale ispirato all'idea dei simulatori di adolescenti anni '90. Codice, testi e grafica sono scritti da zero.
