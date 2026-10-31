import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ENERGIA_CORTEGGIO, provaciBlocked } from '../../game/engine';
import {
  candidati,
  chanceConquista,
  difficolta,
  figosita,
  gp,
  GUSTI,
  gustoLabel,
  nomeRuolo,
  partnerBonus,
} from '../../game/state';
import { GameState, Persona } from '../../game/types';
import { Bar, Button, Card, Chip, SectionTitle } from '../components';
import { colors } from '../theme';
import { ActionCards } from './ActionsScreen';

interface Props {
  state: GameState;
  onAct: (id: string) => void;
  onProvaci: (index: number) => void;
}

function umore(affetto: number): string {
  if (affetto >= 85) return 'Innamoratissim';
  if (affetto >= 60) return 'Felice';
  if (affetto >= 35) return 'Tranquill';
  if (affetto >= 20) return 'Annoiat';
  return 'Sta per mollarti';
}

/** “Felice” resta uguale, gli altri si accordano col genere. */
function umoreLabel(p: Persona, affetto: number): string {
  const u = umore(affetto);
  return u.endsWith('Felice') || u.startsWith('Sta') ? u : u + gp(p, 'o', 'a');
}

function Profilo({ p, children }: { p: Persona; children?: ReactNode }) {
  return (
    <View style={styles.profilo}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{p.emoji}</Text>
      </View>
      <View style={styles.profiloBody}>
        <Text style={styles.nome}>{p.nome}</Text>
        <View style={styles.chips}>
          <Chip label={`😎 ${p.figo}`} color="#FFE3EC" />
          <Chip label={`${GUSTI[p.gusto].emoji} ${gustoLabel(p)}`} />
        </View>
        {children}
      </View>
    </View>
  );
}

export function AmoreScreen({ state, onAct, onProvaci }: Props) {
  const ruolo = nomeRuolo(state.preferenza);
  const p = state.partner;

  if (p) {
    return (
      <View style={styles.wrap}>
        <SectionTitle hint={`Più è figo, più ti dà prestigio: +${partnerBonus(state)} alla tua figosità.`}>
          {ruolo === 'Amore' ? 'Il tuo amore' : gp(p, `Il tuo ${ruolo.toLowerCase()}`, `La tua ${ruolo.toLowerCase()}`)}
        </SectionTitle>
        <Card color="#FFC2D4" style={styles.partnerCard}>
          <Profilo p={p} />
          <Text style={styles.gusto}>
            {GUSTI[p.gusto].emoji} {GUSTI[p.gusto].descrizione}: le azioni giuste valgono il doppio.
          </Text>
          <View style={styles.affettoRow}>
            <Text style={styles.affettoLabel}>💗 {umoreLabel(p, p.affetto)}</Text>
            <Text style={styles.affettoLabel}>{p.affetto}</Text>
          </View>
          <Bar value={p.affetto} color={p.affetto < 25 ? colors.red : colors.pink} height={14} />
          <Text style={styles.small}>
            Insieme da {p.giorni} giorni.
            {p.figo - figosita(state) > 25 ? ` ${gp(p, 'Lui', 'Lei')} è molto più figo di te: si stanca prima.` : ''}
          </Text>
        </Card>
        <ActionCards tab="amore" state={state} onAct={onAct} />
      </View>
    );
  }

  const persone = candidati(state);
  return (
    <View style={styles.wrap}>
      <SectionTitle hint="Ogni settimana gente nuova in giro. Più figosità hai, più è facile.">Single 🙃</SectionTitle>
      {persone.map((c, i) => {
        const blocked = provaciBlocked(state, i);
        const diff = difficolta(chanceConquista(state, c));
        const rifiutato = blocked?.includes('di no');
        return (
          <Card key={`${c.nome}-${i}`} style={rifiutato ? { ...styles.candidato, ...styles.rifiutato } : styles.candidato}>
            <Profilo p={c}>
              <Text style={styles.small}>{GUSTI[c.gusto].descrizione}</Text>
            </Profilo>
            <View style={styles.provaciRow}>
              <Chip label={rifiutato ? '🚫 Ti ha detto di no' : diff.label} color={rifiutato ? colors.disabled : diff.color} />
              <Button
                small
                label={`😏 Provaci · ⚡${ENERGIA_CORTEGGIO}`}
                color={colors.pink}
                disabled={!!rifiutato}
                onPress={() => onProvaci(i)}
              />
            </View>
          </Card>
        );
      })}
      <Text style={styles.small}>
        Consiglio: a chi ama i motori piace chi ha il motorino, a chi chiacchiera piace chi ha il telefono.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  partnerCard: { gap: 10 },
  profilo: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: colors.ink,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 34 },
  profiloBody: { flex: 1, gap: 6 },
  nome: { fontSize: 22, fontWeight: '900', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gusto: { fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 },
  affettoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  affettoLabel: { fontSize: 15, fontWeight: '900', color: colors.ink },
  small: { fontSize: 13, color: colors.ink, lineHeight: 18 },
  candidato: { gap: 12 },
  rifiutato: { opacity: 0.6 },
  provaciRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
