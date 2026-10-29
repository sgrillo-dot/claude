import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pagella } from '../../game/engine';
import { GameState, Preferenza } from '../../game/types';
import { Button, Card, Chip, tap } from '../components';
import { colors, hardShadow } from '../theme';

const PREFERENZE: { id: Preferenza; label: string }[] = [
  { id: 'ragazze', label: '👩 Ragazze' },
  { id: 'ragazzi', label: '👨 Ragazzi' },
  { id: 'tutti', label: '🌈 Tutti' },
];

export function StartScreen({ onStart }: { onStart: (nome: string, p: Preferenza) => void }) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [pref, setPref] = useState<Preferenza>('ragazze');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>😎🛵</Text>
          <Text style={styles.logoTop}>GIARGIA</Text>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBottom}>SIMULATOR</Text>
          </View>
          <Text style={styles.tagline}>Un anno scolastico per diventare il più figo del quartiere.</Text>
        </View>

        <Card style={styles.form}>
          <Text style={styles.label}>Come ti chiami?</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Kevin, Jessica, …"
            placeholderTextColor={colors.muted}
            maxLength={16}
            autoCapitalize="words"
            returnKeyType="done"
            style={styles.input}
          />
          <Text style={styles.label}>Ti piacciono…</Text>
          <View style={styles.prefs}>
            {PREFERENZE.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: pref === p.id }}
                onPress={() => {
                  tap();
                  setPref(p.id);
                }}
                style={[styles.pref, pref === p.id && styles.prefActive]}
              >
                <Text style={styles.prefText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button label="Inizia l’anno! 🚀" color={colors.pink} onPress={() => onStart(nome, pref)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function PagellaScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const insets = useSafeAreaInsets();
  const p = pagella(state);
  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <Text style={styles.pagellaEmoji}>{p.promosso ? '🎓' : '📉'}</Text>
      <Text style={styles.pagellaTitle}>Pagella di {state.nome}</Text>
      <Card color={p.promosso ? colors.teal : colors.pink} style={styles.pagella}>
        <Text style={styles.voto}>{p.voto}</Text>
        <Text style={styles.esito}>{p.promosso ? 'PROMOSSO' : 'BOCCIATO'}</Text>
      </Card>
      <View style={styles.prefs}>
        <Chip label={`😎 Figosità ${p.figosita}`} />
        <Chip label={`🚫 ${state.assenze} assenze`} />
        <Chip label={`💶 ${state.soldi}€`} />
        <Chip label={`💔 ${state.exPartners} ex`} />
      </View>
      <Card>
        <Text style={styles.giudizio}>{p.giudizio}</Text>
      </Card>
      <Button label="Nuovo anno 🔁" color={colors.yellow} onPress={onRestart} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, gap: 22, flexGrow: 1, justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' },
  logo: { alignItems: 'center', gap: 6 },
  logoEmoji: { fontSize: 56 },
  logoTop: { fontSize: 52, fontWeight: '900', color: colors.ink, letterSpacing: -2 },
  logoBadge: {
    backgroundColor: colors.yellow,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-3deg' }],
    ...hardShadow(3),
  },
  logoBottom: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: 4 },
  tagline: { fontSize: 16, fontWeight: '600', color: colors.ink, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  form: { gap: 10 },
  label: { fontSize: 16, fontWeight: '900', color: colors.ink },
  input: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    backgroundColor: '#FFFBEF',
    marginBottom: 8,
  },
  prefs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pref: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  prefActive: { backgroundColor: colors.yellow },
  prefText: { fontSize: 15, fontWeight: '800', color: colors.ink },
  pagellaEmoji: { fontSize: 64, textAlign: 'center' },
  pagellaTitle: { fontSize: 28, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  pagella: { alignItems: 'center', paddingVertical: 24 },
  voto: { fontSize: 72, fontWeight: '900', color: colors.ink },
  esito: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: 3 },
  giudizio: { fontSize: 17, lineHeight: 24, color: colors.ink, fontWeight: '600' },
});
