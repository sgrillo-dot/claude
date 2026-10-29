import * as Haptics from 'expo-haptics';
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatDelta } from '../game/engine';
import { play } from './sound';
import { border, colors, hardShadow, radius, STAT_META } from './theme';

export function tap(kind: 'light' | 'success' | 'warning' = 'light') {
  if (kind === 'light') play('tap');
  if (Platform.OS === 'web') return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
}

export function Card({ children, style, color = colors.card }: { children: ReactNode; style?: ViewStyle; color?: string }) {
  return <View style={[styles.card, { backgroundColor: color }, style]}>{children}</View>;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, color = colors.yellow, disabled, small, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: disabled ? colors.disabled : color },
        pressed ? styles.pressed : hardShadow(small ? 2 : 4),
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, disabled && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

export function Bar({ value, color, height = 12 }: { value: number; color: string; height?: number }) {
  return (
    <View style={[styles.barTrack, { height }]}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function StatRow({ stat, value }: { stat: keyof typeof STAT_META; value: number }) {
  const meta = STAT_META[stat];
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>
          {meta.emoji} {meta.label}
        </Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Bar value={value} color={meta.color} />
    </View>
  );
}

export function Chip({ label, color = colors.card, textColor = colors.ink }: { label: string; color?: string; textColor?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export function DeltaChips({ deltas, center }: { deltas: StatDelta[]; center?: boolean }) {
  if (!deltas.length) return null;
  return (
    <View style={[styles.chipRow, center && { justifyContent: 'center' }]}>
      {deltas.map((d) => {
        const meta = STAT_META[d.key];
        const unit = d.key === 'soldi' ? '€' : '';
        return (
          <Chip
            key={d.key}
            label={`${meta.emoji} ${d.value > 0 ? '+' : ''}${d.value}${unit}`}
            color={d.value > 0 ? '#D8F5E3' : '#FFE0E3'}
          />
        );
      })}
    </View>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{children}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export interface ToastData {
  id: number;
  messages: string[];
  deltas: StatDelta[];
}

/** Notifica che scende dall’alto e sparisce da sola. */
export function Toast({ toast, onHide }: { toast: ToastData | null; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 7 }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => onHide());
    }, 2800 + toast.messages.length * 600);
    return () => clearTimeout(t);
  }, [toast?.id]);

  if (!toast) return null;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] });
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.toastWrap, { top: insets.top + 8, opacity: anim, transform: [{ translateY }] }]}
    >
      <Pressable onPress={onHide} style={[styles.toast, hardShadow(4)]} accessibilityRole="alert">
        {toast.messages.map((m, i) => (
          <Text key={i} style={styles.toastText}>
            {m}
          </Text>
        ))}
        <DeltaChips deltas={toast.deltas} />
      </Pressable>
    </Animated.View>
  );
}

/** Pannello che sale dal basso, per eventi e conferme. */
export function Sheet({ visible, children, onClose }: { visible: boolean; children: ReactNode; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Chiudi" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.grabber} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border,
    borderColor: colors.line,
    borderRadius: radius,
    padding: 16,
    ...hardShadow(4),
  },
  button: {
    minHeight: 52,
    borderWidth: border,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: 12, borderRadius: 12 },
  buttonDisabled: { borderColor: '#B9B3A3' },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `1px 1px 0px ${colors.ink}` },
  buttonText: { fontSize: 17, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  buttonTextSmall: { fontSize: 15 },
  barTrack: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 99,
    backgroundColor: '#F3EEDF',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 99 },
  statRow: { gap: 6 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  chip: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 13, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionTitle: { marginTop: 8, marginBottom: 2, gap: 2 },
  sectionTitleText: { fontSize: 24, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  sectionHint: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  toastWrap: { position: 'absolute', left: 16, right: 16, zIndex: 100, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.yellow,
    borderWidth: border,
    borderColor: colors.line,
    borderRadius: radius,
    padding: 14,
    gap: 8,
  },
  toastText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27,27,31,0.45)' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: border,
    borderBottomWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.ink, opacity: 0.3 },
});
