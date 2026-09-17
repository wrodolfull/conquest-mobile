import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import type { IconName } from '@/types/game';
import { colors } from '@/theme';

interface IconButtonProps { icon: IconName; label: string; badge?: boolean }

export function IconButton({ icon, label, badge }: IconButtonProps) {
  return (
    <Pressable accessibilityLabel={label} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={colors.text} />
      {badge ? <Pressable style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  badge: { position: 'absolute', right: 8, top: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.surfaceRaised },
});
