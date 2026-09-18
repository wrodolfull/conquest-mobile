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
      <View style={styles.actions}>{player.resources.map((resource) => <ResourceCounter compact={compact} key={resource.label} resource={resource} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: 12, marginTop: 8, paddingHorizontal: 13, paddingVertical: 8, gap: 6, borderRadius: 18, backgroundColor: '#07100ED9', borderWidth: 1, borderColor: '#375048', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24372F', borderWidth: 1.5, borderColor: '#739E65', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.lime, fontSize: 16, fontWeight: '900' },
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 20, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  player: { flex: 1, maxWidth: 145 }, welcome: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1 }, name: { color: colors.text, fontSize: 16, fontWeight: '900' },
  xpTrack: { width: 96, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 4 }, xpFill: { height: '100%' },
  actions: { position: 'absolute', right: 53, top: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
});
