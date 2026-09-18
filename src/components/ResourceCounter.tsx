import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { Resource } from '@/types/game';

export function ResourceCounter({ resource, compact = false }: { resource: Resource; compact?: boolean }) {
  return (
    <View accessibilityLabel={`${resource.label}: ${resource.value}`} style={[styles.counter, compact && styles.compact]}>
      <Ionicons name={resource.icon} size={compact ? 14 : 16} color={resource.color} />
      <Text style={styles.value}>{resource.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  compact: { minHeight: 28, paddingHorizontal: 7, backgroundColor: '#172521CC' },
  value: { color: colors.text, fontSize: 11, fontWeight: '900' },
});
