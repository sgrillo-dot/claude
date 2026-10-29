import { Item } from './types';

const LIST: Item[] = [
  // Vestiti
  { id: 'tuta', nome: 'Tuta acetata', emoji: '🎽', categoria: 'vestiti', prezzo: 35, figo: 3, descrizione: 'Fruscia quando cammini. Si sente che arrivi.' },
  { id: 'felpa', nome: 'Felpa XXL', emoji: '🧥', categoria: 'vestiti', prezzo: 45, figo: 4, descrizione: 'Due taglie in più, cappuccio sempre su.' },
  { id: 'jeans', nome: 'Jeans strappati', emoji: '👖', categoria: 'vestiti', prezzo: 55, figo: 5, descrizione: 'Più buchi che jeans. Tua nonna non approva.' },
  { id: 'smanicato', nome: 'Smanicato lucido', emoji: '🦺', categoria: 'vestiti', prezzo: 90, figo: 8, descrizione: 'Riflette il sole. E gli sguardi.' },
  { id: 'sneakers', nome: 'Sneakers Fulmine', emoji: '👟', categoria: 'vestiti', prezzo: 130, figo: 11, descrizione: 'Edizione limitata. Guai a chi le pesta.' },
  // Accessori
  { id: 'gel', nome: 'Gel ultra-fissante', emoji: '🧴', categoria: 'accessori', prezzo: 8, figo: 1, descrizione: 'Il ciuffo resiste anche al casco.' },
  { id: 'cover', nome: 'Cover glitterata', emoji: '✨', categoria: 'accessori', prezzo: 12, figo: 1, descrizione: 'Brilla anche al buio.' },
  { id: 'cappellino', nome: 'Cappellino visiera piatta', emoji: '🧢', categoria: 'accessori', prezzo: 20, figo: 2, descrizione: "Con l'adesivo ancora attaccato, ovviamente." },
  { id: 'catenina', nome: 'Catenina "oro"', emoji: '📿', categoria: 'accessori', prezzo: 25, figo: 3, descrizione: 'Oro 0 carati. Nessuno se ne accorgerà.' },
  { id: 'occhiali', nome: 'Occhiali a specchio', emoji: '🕶️', categoria: 'accessori', prezzo: 30, figo: 3, descrizione: 'Anche in classe. Anche di sera.' },
  { id: 'profumo', nome: 'Profumo "Tamarro n°5"', emoji: '🌸', categoria: 'accessori', prezzo: 45, figo: 4, descrizione: 'Si sente da tre isolati.' },
  { id: 'cassa', nome: 'Cassa bluetooth', emoji: '🔊', categoria: 'accessori', prezzo: 70, figo: 6, descrizione: 'Musica a palla sul bus. Sempre.' },
  // Telefoni
  { id: 'conchiglia', nome: 'Telefonino a conchiglia', emoji: '📞', categoria: 'telefoni', prezzo: 60, figo: 1, descrizione: 'Si chiude con un clac soddisfacente. Per chattare basta.' },
  { id: 'smartphone', nome: 'Smartphone "Mela Pro"', emoji: '📱', categoria: 'telefoni', prezzo: 450, figo: 9, descrizione: 'Fotocamera da paura: ora puoi postare sui social.' },
  // Motorini
  { id: 'scooter_rotto', nome: 'Scooter "Ciao Rotto"', emoji: '🛵', categoria: 'motorini', prezzo: 300, figo: 8, descrizione: 'Usato, fumoso, ma è tuo.' },
  { id: 'scooter_fulmine', nome: 'Scooter Fulmine 50', emoji: '🛵', categoria: 'motorini', prezzo: 900, figo: 15, descrizione: 'Il sogno di ogni giargia.' },
  { id: 'scooter_bestia', nome: 'Scooter Bestia 125', emoji: '🏍️', categoria: 'motorini', prezzo: 2000, figo: 25, descrizione: 'Quando passi, la piazzetta si gira.' },
  // Bar
  { id: 'gomme', nome: 'Gomme alla menta', emoji: '🍬', categoria: 'bar', prezzo: 1, figo: 0, descrizione: 'Alito fresco, +1 figo.', consumabile: { figo: 1 } },
  { id: 'granita', nome: 'Granita al limone', emoji: '🍧', categoria: 'bar', prezzo: 2, figo: 0, descrizione: 'Ti tira su: +15 energia.', consumabile: { energia: 15 } },
  { id: 'energy', nome: 'Energy drink "Turbo Toro"', emoji: '🥤', categoria: 'bar', prezzo: 3, figo: 0, descrizione: 'Il cuore batte a tempo di techno: +30 energia.', consumabile: { energia: 30 } },
  { id: 'panino', nome: 'Panino con porchetta', emoji: '🥪', categoria: 'bar', prezzo: 5, figo: 0, descrizione: 'Pranzo dei campioni: +40 energia.', consumabile: { energia: 40 } },
];

export const ITEMS: Record<string, Item> = Object.fromEntries(LIST.map((i) => [i.id, i]));

export const MOTORINI: Record<string, Item> = Object.fromEntries(
  LIST.filter((i) => i.categoria === 'motorini').map((i) => [i.id, i]),
);

export function itemsByCategory(categoria: Item['categoria']): Item[] {
  return LIST.filter((i) => i.categoria === categoria);
}

export const COSTO_TRUCCO = 150;

export interface LavoroDef {
  id: string;
  nome: string;
  emoji: string;
  paga: number;
  figo: number;
}

export const LAVORI: LavoroDef[] = [
  { id: 'pizzeria', nome: 'Pizzeria Da Gino', emoji: '🍕', paga: 32, figo: 0 },
  { id: 'scarpe', nome: 'Negozio di scarpe', emoji: '👟', paga: 28, figo: 1 },
  { id: 'gelateria', nome: 'Gelateria Polo Nord', emoji: '🍦', paga: 26, figo: 2 },
  { id: 'magazzino', nome: 'Magazzino del supermercato', emoji: '📦', paga: 38, figo: -1 },
];

export const LAVORI_BY_ID: Record<string, LavoroDef> = Object.fromEntries(LAVORI.map((l) => [l.id, l]));

/** Il pieno costa in base a quanto è vuoto il serbatoio. */
export function costoPieno(benzina: number): number {
  return Math.ceil((100 - benzina) / 7);
}

export function costoRiparazione(condizione: number): number {
  return Math.ceil((100 - condizione) * 1.5);
}
