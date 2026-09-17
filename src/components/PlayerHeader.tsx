import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { ResourceCounter } from '@/components/ResourceCounter';
import { player } from '@/mocks/game';
import { colors } from '@/theme';

export function PlayerHeader() {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{player.initial}</Text><View style={styles.level}><Text style={styles.levelText}>{player.level}</Text></View></View>
        <View style={styles.player}>
          <Text style={styles.welcome}>WELCOME BACK</Text><Text numberOfLines={1} style={styles.name}>{player.name}</Text>
          <View style={styles.xpTrack}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpFill, { width: `${player.xpPercent}%` }]} /></View>
          <Text style={styles.xpText}>{player.xpLabel}</Text>
        </View>
      </View>
      <View style={styles.actions}>{player.resources.map((resource) => <ResourceCounter compact={compact} key={resource.label} resource={resource} />)}<IconButton icon="notifications-outline" label="Notifications" badge /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#263723', borderWidth: 1, borderColor: '#55703D', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.lime, fontSize: 20, fontWeight: '900' },
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 20, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  player: { flex: 1 }, welcome: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, name: { color: colors.text, fontSize: 19, fontWeight: '900' },
  xpTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 3 }, xpFill: { height: '100%' }, xpText: { color: colors.muted, fontSize: 8, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
});
