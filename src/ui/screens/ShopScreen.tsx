import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COSTO_TRUCCO, costoPieno, costoRiparazione, itemsByCategory, MOTORINI } from '../../game/items';
import { GameState, ItemCategory } from '../../game/types';
import { Bar, Button, Card, Chip, SectionTitle, tap } from '../components';
import { colors } from '../theme';

const CATEGORIE: { id: ItemCategory; label: string }[] = [
  { id: 'vestiti', label: '👕 Vestiti' },
  { id: 'accessori', label: '💍 Accessori' },
  { id: 'telefoni', label: '📱 Telefoni' },
  { id: 'motorini', label: '🛵 Motorini' },
  { id: 'bar', label: '🥤 Bar' },
];

interface Props {
  state: GameState;
  onBuy: (id: string) => void;
  onRepair: () => void;
  onTrucca: () => void;
  onFillTank: () => void;
}

export function ShopScreen({ state, onBuy, onRepair, onTrucca, onFillTank }: Props) {
  const [cat, setCat] = useState<ItemCategory>('vestiti');
  const m = state.motorino;

  return (
    <View style={styles.wrap}>
      <SectionTitle hint="Il look è tutto. Il portafoglio un po’ meno.">Negozi</SectionTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CATEGORIE.map((c) => {
          const active = c.id === cat;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                tap();
                setCat(c.id);
              }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={styles.tabText}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {cat === 'motorini' && m ? (
        <Card color={colors.teal} style={styles.garage}>
          <Text style={styles.garageTitle}>
            🔧 Il tuo {MOTORINI[m.id].nome}
            {m.truccato ? ' (truccato)' : ''}
          </Text>
          <Bar value={m.condizione} color={m.condizione < 30 ? colors.red : colors.yellow} />
          <Text style={styles.garageSub}>Condizioni {m.condizione}%</Text>
          <Bar value={m.benzina} color={m.benzina < 20 ? colors.red : colors.orange} />
          <Text style={styles.garageSub}>Benzina {m.benzina}%</Text>
          <View style={styles.garageButtons}>
            <Button
              small
              style={{ flex: 1 }}
              label={m.condizione >= 100 ? 'Perfetto ✓' : `Ripara ${costoRiparazione(m.condizione)}€`}
              disabled={m.condizione >= 100}
              onPress={onRepair}
            />
            <Button
              small
              style={{ flex: 1 }}
              color={colors.orange}
              label={m.truccato ? 'Truccato ✓' : `Trucca ${COSTO_TRUCCO}€`}
              disabled={m.truccato}
              onPress={onTrucca}
            />
          </View>
          <Button
            small
            color={colors.card}
            label={m.benzina >= 100 ? '⛽ Serbatoio pieno' : `⛽ Fai il pieno ${costoPieno(m.benzina)}€`}
            disabled={m.benzina >= 100}
            onPress={onFillTank}
          />
        </Card>
      ) : null}

      {itemsByCategory(cat).map((item) => {
        const owned = item.categoria === 'motorini' ? m?.id === item.id : state.inventario.includes(item.id);
        const caro = state.soldi < item.prezzo;
        return (
          <Card key={item.id} style={styles.item}>
            <View style={styles.itemTile}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.itemBody}>
              <Text style={styles.itemName}>{item.nome}</Text>
              <Text style={styles.itemDesc}>{item.descrizione}</Text>
              {item.figo ? <Chip label={`😎 +${item.figo} figosità`} color="#FFE3EC" /> : null}
            </View>
            <Button
              small
              label={owned ? '✓ Tuo' : `${item.prezzo}€`}
              color={owned ? colors.teal : caro ? colors.disabled : colors.yellow}
              disabled={owned}
              onPress={() => onBuy(item.id)}
              style={styles.price}
            />
          </Card>
        );
      })}
      {cat === 'motorini' && m ? (
        <Text style={styles.note}>Comprando un altro motorino, il vecchio lo dai via.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  tabs: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  tab: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.yellow },
  tabText: { fontSize: 15, fontWeight: '800', color: colors.ink },
  garage: { gap: 8 },
  garageTitle: { fontSize: 17, fontWeight: '900', color: colors.ink },
  garageSub: { fontSize: 13, fontWeight: '700', color: colors.ink },
  garageButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  itemTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: '#FFF0C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 26 },
  itemBody: { flex: 1, gap: 4, alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: '900', color: colors.ink },
  itemDesc: { fontSize: 13, color: colors.ink, lineHeight: 18 },
  price: { minWidth: 72 },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});
