import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIONS } from '../../game/actions';
import { isDiscoNight, isSchoolDay } from '../../game/calendar';
import { actionBlocked } from '../../game/engine';
import { ActionTab, GameState } from '../../game/types';
import { Chip, SectionTitle, tap } from '../components';
import { colors, hardShadow } from '../theme';

const TITLES: Record<ActionTab, { titolo: string; color: string }> = {
  scuola: { titolo: 'Scuola', color: '#CFE0FF' },
  uscite: { titolo: 'Uscite', color: '#FFD6E2' },
  lavoro: { titolo: 'Lavoretti', color: '#D8F5E3' },
};

function hintFor(tab: ActionTab, s: GameState): string {
  if (tab === 'scuola') {
    if (!isSchoolDay(s.day)) return 'Weekend! Niente scuola, ma puoi sempre studiare.';
    return s.scuolaOggi ? 'Scuola fatta per oggi.' : 'Oggi c’è scuola: se non scegli, è assenza.';
  }
  if (tab === 'uscite') return isDiscoNight(s.day) ? 'Stasera la disco è aperta! 🪩' : 'La disco apre venerdì e sabato.';
  return 'Soldi veri, fatica vera.';
}

export function ActionsScreen({ tab, state, onAct }: { tab: ActionTab; state: GameState; onAct: (id: string) => void }) {
  const actions = ACTIONS.filter((a) => a.tab === tab);
  const meta = TITLES[tab];

  return (
    <View style={styles.wrap}>
      <SectionTitle hint={hintFor(tab, state)}>{meta.titolo}</SectionTitle>
      {actions.map((a) => {
        const blocked = actionBlocked(state, a.id);
        return (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!blocked }}
            accessibilityHint={blocked ?? a.descrizione}
            onPress={() => {
              tap();
              onAct(a.id);
            }}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: blocked ? colors.disabled : colors.card },
              blocked ? styles.actionBlocked : pressed ? styles.pressed : hardShadow(4),
            ]}
          >
            <View style={[styles.emojiTile, { backgroundColor: blocked ? '#F3EEDF' : meta.color }]}>
              <Text style={styles.emoji}>{a.emoji}</Text>
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, blocked && styles.muted]}>{a.titolo}</Text>
              <Text style={styles.desc}>{blocked ?? a.descrizione}</Text>
              {a.energia || a.soldi ? (
                <View style={styles.costs}>
                  {a.energia ? <Chip label={`⚡ −${a.energia}`} color={state.energia < a.energia ? '#FFE0E3' : '#FFF0DC'} /> : null}
                  {a.soldi ? <Chip label={`💶 −${a.soldi}€`} color={state.soldi < a.soldi ? '#FFE0E3' : '#E6F7EE'} /> : null}
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  action: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionBlocked: { borderColor: '#B9B3A3' },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `1px 1px 0px ${colors.ink}` },
  emojiTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 17, fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted },
  desc: { fontSize: 14, color: colors.ink, lineHeight: 19 },
  costs: { flexDirection: 'row', gap: 6, marginTop: 4 },
});
