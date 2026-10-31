import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIONS } from '../../game/actions';
import { festa, isDiscoNight, isSchoolDay } from '../../game/calendar';
import { actionBlocked, mediaVoti } from '../../game/engine';
import { MATERIE } from '../../game/state';
import { ActionTab, GameState } from '../../game/types';
import { Card, Chip, SectionTitle, tap } from '../components';
import { colors, hardShadow } from '../theme';

const TITLES: Record<ActionTab, { titolo: string; color: string }> = {
  scuola: { titolo: 'Scuola', color: '#CFE0FF' },
  uscite: { titolo: 'Uscite', color: '#FFD6E2' },
  lavoro: { titolo: 'Lavoretti', color: '#D8F5E3' },
  amore: { titolo: 'Amore', color: '#FFD6E2' },
};

function hintFor(tab: ActionTab, s: GameState): string {
  if (tab === 'scuola') {
    if (festa(s.day)) return `${festa(s.day)}! Niente scuola, ma puoi sempre studiare.`;
    if (!isSchoolDay(s.day)) return 'Weekend! Niente scuola, ma puoi sempre studiare.';
    return s.scuolaOggi ? 'Scuola fatta per oggi.' : 'Oggi c’è scuola: se non scegli, è assenza.';
  }
  if (tab === 'uscite') return isDiscoNight(s.day) ? 'Stasera la disco è aperta! 🪩' : 'La disco apre venerdì e sabato.';
  return 'Soldi veri, fatica vera.';
}

export function ActionsScreen({ tab, state, onAct }: { tab: ActionTab; state: GameState; onAct: (id: string) => void }) {
  const meta = TITLES[tab];
  return (
    <View style={styles.wrap}>
      <SectionTitle hint={hintFor(tab, state)}>{meta.titolo}</SectionTitle>
      {tab === 'scuola' ? <Registro state={state} /> : null}
      <ActionCards tab={tab} state={state} onAct={onAct} />
    </View>
  );
}

/** Le schede delle azioni di una sezione, con costi e motivo del blocco. */
export function ActionCards({ tab, state, onAct }: { tab: ActionTab; state: GameState; onAct: (id: string) => void }) {
  const meta = TITLES[tab];
  return (
    <>
      {ACTIONS.filter((a) => a.tab === tab).map((a) => {
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
    </>
  );
}

function Registro({ state }: { state: GameState }) {
  const { media } = mediaVoti(state);
  return (
    <Card style={styles.registro}>
      <View style={styles.registroHead}>
        <Text style={styles.registroTitle}>📒 Registro</Text>
        <Text style={styles.registroMedia}>Media {media.toFixed(1)}</Text>
      </View>
      <View style={styles.voti}>
        {MATERIE.map((m) => {
          const v = state.voti[m.id];
          return (
            <View key={m.id} style={[styles.voto, { backgroundColor: v < 6 ? '#FFE0E3' : v >= 8 ? '#D8F5E3' : colors.card }]}>
              <Text style={styles.votoNum}>{v}</Text>
              <Text style={styles.votoLabel} numberOfLines={1}>
                {m.emoji} {m.nome}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.registroHint}>I voti arrivano con interrogazioni e verifiche. Più studi, più vai bene.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  registro: { gap: 10 },
  registroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  registroTitle: { fontSize: 18, fontWeight: '900', color: colors.ink },
  registroMedia: { fontSize: 15, fontWeight: '900', color: colors.ink },
  voti: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voto: {
    width: '31%',
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  votoNum: { fontSize: 24, fontWeight: '900', color: colors.ink },
  votoLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  registroHint: { fontSize: 13, color: colors.muted },
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
