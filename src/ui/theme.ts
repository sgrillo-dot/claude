import { StatKey } from '../game/types';

export const colors = {
  bg: '#FFF4D6',
  ink: '#1B1B1F',
  card: '#FFFFFF',
  muted: '#6B6B76',
  line: '#1B1B1F',
  yellow: '#FFD23F',
  pink: '#FF5D8F',
  teal: '#2EC4B6',
  purple: '#7B2CBF',
  blue: '#3A86FF',
  orange: '#FF8C42',
  red: '#E63946',
  green: '#2A9D8F',
  disabled: '#E9E4D6',
};

export const radius = 16;
export const border = 2.5;

/** Ombra “piena” stile anni ’90: un blocco nero spostato. */
export const hardShadow = (offset = 4) => ({ boxShadow: `${offset}px ${offset}px 0px ${colors.ink}` });

export const STAT_META: Record<StatKey, { label: string; emoji: string; color: string }> = {
  soldi: { label: 'Soldi', emoji: '💶', color: colors.green },
  figo: { label: 'Figosità', emoji: '😎', color: colors.pink },
  studio: { label: 'Studio', emoji: '📚', color: colors.blue },
  energia: { label: 'Energia', emoji: '⚡', color: colors.orange },
  genitori: { label: 'Genitori', emoji: '👪', color: colors.purple },
};

export function avatarFor(figosita: number): string {
  if (figosita < 20) return '🤓';
  if (figosita < 40) return '🙂';
  if (figosita < 60) return '😎';
  if (figosita < 80) return '🤩';
  return '👑';
}
