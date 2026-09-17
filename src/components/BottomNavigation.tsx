import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { navigationItems } from '@/mocks/game';
import { colors } from '@/theme';

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <View accessibilityRole="tablist" style={styles.nav}>
      {navigationItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            key={item.href}
            onPress={() => router.replace(item.href)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            {active ? <View style={styles.indicator} /> : null}
            <View style={[styles.icon, active && styles.activeIcon]}><Ionicons name={active ? item.activeIcon : item.icon} size={21} color={active ? colors.cyan : colors.muted} /></View>
            <Text numberOfLines={1} style={[styles.label, active && styles.active]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { minHeight: 67, flexDirection: 'row', backgroundColor: '#08110FF5', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 7, paddingHorizontal: 2 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 1, position: 'relative' },
  pressed: { opacity: 0.65 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  icon: { width: 35, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: '#37D8D112' },
  active: { color: colors.cyan },
  indicator: { position: 'absolute', top: -8, width: 34, height: 2, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.cyan },
});
