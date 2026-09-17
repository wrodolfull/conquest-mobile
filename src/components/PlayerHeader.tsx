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
      <View style={styles.topRow}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{player.initial}</Text><View style={styles.level}><Text style={styles.levelText}>{player.level}</Text></View></View>
        <View style={styles.player}>
          <Text numberOfLines={1} style={styles.name}>{player.name}</Text>
          <Text style={styles.welcome}>LEVEL {player.level}</Text>
          <View style={styles.xpTrack}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpFill, { width: `${player.xpPercent}%` }]} /></View>
        </View>
      </View>
      <IconButton icon="notifications-outline" label="Notifications" badge />
      </View>
      <View style={styles.actions}>{player.resources.map((resource) => <ResourceCounter compact={compact} key={resource.label} resource={resource} />)}<View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>EXPLORER</Text></View></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 9, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#24372F', borderWidth: 1.5, borderColor: '#739E65', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.lime, fontSize: 20, fontWeight: '900' },
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 20, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  player: { flex: 1, maxWidth: 150 }, welcome: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, name: { color: colors.text, fontSize: 19, fontWeight: '900' },
  xpTrack: { width: 96, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 4 }, xpFill: { height: '100%' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 58 },
  status: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime },
  statusText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
});
