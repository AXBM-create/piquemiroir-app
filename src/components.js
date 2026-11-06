import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, RIVAL_NAME } from './theme';

export function Title({ kicker, children }) {
  return (
    <View style={{ gap: 4 }}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, disabled && { opacity: 0.4 }, pressed && { opacity: 0.85 }, style]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function RivalBubble({ children }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Avatar size={28} />
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{children}</Text>
      </View>
    </View>
  );
}

export function Avatar({ size = 32 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontWeight: '800', color: colors.bg, fontSize: size * 0.42 }}>{RIVAL_NAME[0]}</Text>
    </View>
  );
}

export function Bar({ pct, color }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  kicker: { fontSize: 13, color: colors.muted },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.me,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  secondary: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  bubble: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  avatar: { backgroundColor: colors.rival, alignItems: 'center', justifyContent: 'center' },
  barTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: colors.line, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
  big: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  label: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
});
