import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDay, LAST_DAY } from '../../game/calendar';
import { LAVORI_BY_ID, MOTORINI } from '../../game/items';
import { figosita, titoloGiargia } from '../../game/state';
import { GameState } from '../../game/types';
import { Bar, Button, Card, Chip, Sheet, StatRow } from '../components';
import { avatarFor, colors } from '../theme';

export function HomeScreen({ state, onReset }: { state: GameState; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const f = figosita(state);
  const m = state.motorino;
  const p = state.partner;

  return (
    <View style={styles.wrap}>
      <Card color={colors.pink} style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{avatarFor(f)}</Text>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroName} numberOfLines={1}>
            {state.nome}
          </Text>
          <Text style={styles.heroTitle}>{titoloGiargia(state)}</Text>
          <View style={styles.heroFigo}>
            <View style={{ flex: 1 }}>
              <Bar value={f} color={colors.yellow} height={14} />
            </View>
            <Text style={styles.heroFigoValue}>{f}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.stats}>
        <StatRow stat="studio" value={state.studio} />
        <StatRow stat="energia" value={state.energia} />
        <StatRow stat="genitori" value={state.genitori} />
      </Card>

      <View style={styles.row}>
        <Card style={styles.half} color={m ? colors.teal : colors.card}>
          <Text style={styles.tileEmoji}>{m ? MOTORINI[m.id].emoji : '🚶'}</Text>
          <Text style={styles.tileTitle} numberOfLines={2}>
            {m ? MOTORINI[m.id].nome : 'A piedi'}
          </Text>
          {m ? (
            <>
              <Bar value={m.condizione} color={m.condizione < 30 ? colors.red : colors.yellow} />
              <Text style={styles.tileSub}>
                {m.condizione === 0 ? 'Rotto! Va riparato' : `Condizioni ${m.condizione}%`}
                {m.truccato ? ' · truccato' : ''}
                {'\n'}
                {m.benzina === 0 ? '⛽ A secco!' : `⛽ Benzina ${m.benzina}%`}
              </Text>
            </>
          ) : (
            <Text style={styles.tileSub}>Un motorino ti farebbe comodo…</Text>
          )}
        </Card>
        <Card style={styles.half} color={p ? '#FFC2D4' : colors.card}>
          <Text style={styles.tileEmoji}>{p ? '💘' : '🙃'}</Text>
          <Text style={styles.tileTitle} numberOfLines={2}>
            {p ? p.nome : 'Single'}
          </Text>
          {p ? (
            <>
              <Bar value={p.affetto} color={colors.pink} />
              <Text style={styles.tileSub}>
                {p.affetto < 25 ? 'Ti sta per mollare!' : `Insieme da ${p.giorni} giorni`}
              </Text>
            </>
          ) : (
            <Text style={styles.tileSub}>Prova a rimorchiare nelle Uscite</Text>
          )}
        </Card>
      </View>

      <View style={styles.chips}>
        <Chip label={`📅 Giorno ${state.day}/${LAST_DAY}`} />
        <Chip label={`🚫 ${state.assenze} assenze`} color={state.assenze > 40 ? '#FFE0E3' : colors.card} />
        {state.lavoro ? <Chip label={`${LAVORI_BY_ID[state.lavoro.id].emoji} ${LAVORI_BY_ID[state.lavoro.id].nome}`} color="#D8F5E3" /> : null}
        {state.exPartners > 0 ? <Chip label={`💔 ${state.exPartners} ex`} /> : null}
      </View>

      <Card>
        <Text style={styles.diaryTitle}>📓 Diario</Text>
        {state.log.slice(0, 8).map((l, i) => (
          <View key={`${l.day}-${i}`} style={styles.diaryRow}>
            <Text style={styles.diaryDay}>{formatDay(l.day)}</Text>
            <Text style={styles.diaryText}>{l.text}</Text>
          </View>
        ))}
      </Card>

      <Button label="Ricomincia da capo" color={colors.card} small onPress={() => setConfirmReset(true)} />

      <Sheet visible={confirmReset} onClose={() => setConfirmReset(false)}>
        <Text style={styles.sheetTitle}>Ricominciare?</Text>
        <Text style={styles.sheetText}>Perdi tutti i progressi di {state.nome}. Non si torna indietro.</Text>
        <Button
          label="Sì, nuova partita"
          color={colors.red}
          onPress={() => {
            setConfirmReset(false);
            onReset();
          }}
        />
        <Button label="No, continuo" color={colors.card} onPress={() => setConfirmReset(false)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.yellow,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 42 },
  heroText: { flex: 1, gap: 4 },
  heroName: { fontSize: 26, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  heroTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  heroFigo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  heroFigoValue: { fontSize: 18, fontWeight: '900', color: colors.ink, minWidth: 30, textAlign: 'right' },
  stats: { gap: 14 },
  row: { flexDirection: 'row', gap: 14 },
  half: { flex: 1, gap: 8 },
  tileEmoji: { fontSize: 30 },
  tileTitle: { fontSize: 16, fontWeight: '900', color: colors.ink },
  tileSub: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaryTitle: { fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  diaryRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EFE8D6', gap: 2 },
  diaryDay: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  diaryText: { fontSize: 15, color: colors.ink, lineHeight: 20 },
  sheetTitle: { fontSize: 24, fontWeight: '900', color: colors.ink },
  sheetText: { fontSize: 16, color: colors.ink, lineHeight: 22 },
});
