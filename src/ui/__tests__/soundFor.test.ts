import { buyItem, fillTank, performAction } from '../../game/engine';
import { newGame } from '../../game/state';
import { GameState } from '../../game/types';
import { soundFor } from '../soundFor';

const always = (v: number) => () => v;
const base = (over: Partial<GameState> = {}): GameState => ({ ...newGame('Kevin', 'm', 'ragazze'), ...over });

describe('soundFor', () => {
  it('errore quando la mossa non è possibile', () => {
    const s = base({ energia: 0 });
    expect(soundFor(s, performAction(s, 'volantini', always(0.5)).state)).toBe('error');
  });

  it('cuore quando ti metti insieme a qualcuno', () => {
    const s = base();
    expect(soundFor(s, performAction(s, 'corteggia', always(0)).state)).toBe('love');
  });

  it('motorino quando lo compri o fai benzina', () => {
    const s = base({ soldi: 500 });
    const conMotorino = buyItem(s, 'scooter_rotto').state;
    expect(soundFor(s, conMotorino)).toBe('scooter');
    const secco = { ...conMotorino, motorino: { ...conMotorino.motorino!, benzina: 10 } };
    expect(soundFor(secco, fillTank(secco).state)).toBe('scooter');
  });

  it('monete per acquisti e guadagni, positivo o negativo per il resto', () => {
    const s = base({ soldi: 100 });
    expect(soundFor(s, buyItem(s, 'felpa').state)).toBe('coin');
    expect(soundFor(s, performAction(s, 'volantini', always(0.5)).state)).toBe('coin');
    expect(soundFor(s, performAction(s, 'studia_casa', always(0.5)).state)).toBe('good');
    expect(soundFor(s, { ...s, figo: s.figo - 3 })).toBe('bad');
  });
});
