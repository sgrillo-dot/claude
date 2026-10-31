import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDay } from '../game/calendar';
import { pendingEvent } from '../game/engine';
import { choiceLabel } from '../game/events';
import { GameState } from '../game/types';
import { Button, DeltaChips, Sheet, tap } from './components';
import { ActionsScreen } from './screens/ActionsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ShopScreen } from './screens/ShopScreen';
import { play } from './sound';
import { colors, hardShadow } from './theme';
import { Game } from './useGame';

type Tab = 'home' | 'scuola' | 'shop' | 'uscite' | 'lavoro';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'home', emoji: '🏠', label: 'Tu' },
  { id: 'scuola', emoji: '📚', label: 'Scuola' },
  { id: 'shop', emoji: '🛍️', label: 'Negozi' },
  { id: 'uscite', emoji: '🌃', label: 'Uscite' },
  { id: 'lavoro', emoji: '💼', label: 'Lavoro' },
];

export function GameScreen({ game, state }: { game: Game; state: GameState }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const scroll = useRef<ScrollViewInstance>(null);
  const event = pendingEvent(state);
  const result = game.eventResult;

  // L'imprevisto arriva un attimo dopo, così si legge prima l'esito della mossa.
  const [shownEventId, setShownEventId] = useState<string | null>(state.pendingEventId);
  useEffect(() => {
    if (!state.pendingEventId) {
      setShownEventId(null);
      return;
    }
    if (state.pendingEventId === shownEventId) return;
    const t = setTimeout(() => {
      setShownEventId(state.pendingEventId);
      play('event');
    }, 1300);
    return () => clearTimeout(t);
  }, [state.pendingEventId, state.day]);

  // Quante voci nuove ci sono nel diario dall'ultima volta che hai guardato la scheda "Tu".
  const [seen, setSeen] = useState(state.log[0]);
  useEffect(() => {
    if (tab === 'home') setSeen(state.log[0]);
  }, [tab, state.log]);
  const seenIndex = state.log.indexOf(seen);
  const unread = seenIndex === -1 ? state.log.length : seenIndex;

  const switchTab = (t: Tab) => {
    tap();
    if (t === tab) scroll.current?.scrollTo({ y: 0, animated: true });
    setTab(t);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{formatDay(state.day)}</Text>
          <Text style={styles.appName}>Giargia Simulator</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#D8F5E3' }]}>
          <Text style={styles.pillText}>💶 {state.soldi}€</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: state.energia < 25 ? '#FFE0E3' : '#FFF0DC' }]}>
          <Text style={styles.pillText}>⚡ {state.energia}</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Suoni"
          accessibilityState={{ checked: game.soundOn }}
          hitSlop={8}
          onPress={game.toggleSound}
          style={[styles.pill, styles.soundPill]}
        >
          <Text style={styles.pillText}>{game.soundOn ? '🔊' : '🔇'}</Text>
        </Pressable>
      </View>

      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'home' ? <HomeScreen state={state} onReset={game.reset} /> : null}
        {tab === 'scuola' || tab === 'uscite' || tab === 'lavoro' ? (
          <ActionsScreen tab={tab} state={state} onAct={game.act} />
        ) : null}
        {tab === 'shop' ? (
          <ShopScreen state={state} onBuy={game.buy} onRepair={game.repair} onTrucca={game.trucca} onFillTank={game.fillTank} />
        ) : null}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Button
          label={`🌙 Vai a dormire · domani ${formatDay(state.day + 1)}`}
          color={colors.purple}
          onPress={game.sleep}
          style={styles.sleep}
        />
        <View style={styles.tabBar} accessibilityRole="tablist">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
                onPress={() => switchTab(t.id)}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                {t.id === 'home' && unread > 0 && tab !== 'home' ? (
                  <View style={styles.badge} accessibilityLabel={`${unread} novità nel diario`}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                ) : null}
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Sheet visible={(!!event && shownEventId === state.pendingEventId) || !!result}>
        {result ? (
          <>
            <Text style={styles.eventEmoji}>{result.emoji}</Text>
            <Text style={styles.eventTitle}>{result.titolo}</Text>
            {result.messages.map((m, i) => (
              <Text key={i} style={styles.eventText}>
                {m}
              </Text>
            ))}
            <DeltaChips deltas={result.deltas} center />
            <Button label="Ok, avanti" onPress={game.closeEventResult} />
          </>
        ) : event ? (
          <>
            <Text style={styles.eventEmoji}>{event.emoji}</Text>
            <Text style={styles.eventTitle}>{event.titolo}</Text>
            <Text style={styles.eventText}>{event.testo(state)}</Text>
            {event.scelte.map((c, i) => (
              <Button key={i} label={choiceLabel(c, state)} color={i === 0 ? colors.yellow : colors.card} onPress={() => game.choose(i)} />
            ))}
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.yellow,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.ink,
  },
  date: { fontSize: 20, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  appName: { fontSize: 12, fontWeight: '800', color: colors.ink, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
  pill: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  soundPill: { backgroundColor: colors.card, paddingHorizontal: 8 },
  pillText: { fontSize: 15, fontWeight: '900', color: colors.ink, fontVariant: ['tabular-nums'] },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  bottom: {
    backgroundColor: colors.card,
    borderTopWidth: 2.5,
    borderTopColor: colors.ink,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  sleep: { width: '100%', maxWidth: 616, alignSelf: 'center' },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', maxWidth: 640, width: '100%', alignSelf: 'center' },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 52,
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '900', color: colors.ink },
  tabItemActive: { backgroundColor: colors.yellow, borderColor: colors.ink, ...hardShadow(2) },
  tabEmoji: { fontSize: 22 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 2 },
  tabLabelActive: { color: colors.ink, fontWeight: '900' },
  eventEmoji: { fontSize: 56, textAlign: 'center', marginTop: 4 },
  eventTitle: { fontSize: 24, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  eventText: { fontSize: 17, lineHeight: 24, color: colors.ink, textAlign: 'center' },
});
