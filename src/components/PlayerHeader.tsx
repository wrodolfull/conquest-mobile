import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { ResourceCounter } from '@/components/ResourceCounter';
import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { socialSummaryRepository } from '@/services/backend/socialSummaryRepository';

export function PlayerHeader() {
  const { profile, progress } = useAuth();
  const name = profile?.display_name || profile?.username || 'Player'; const level = progress?.level; const initial = name.slice(0, 1).toUpperCase(); const xpPercent = progress ? Math.min(100, progress.xp % 1000 / 10) : 0; const resources = [{ label: 'Energy', value: progress ? String(progress.energy) : '—', icon: 'flash' as const, color: colors.gold }, { label: 'Coins', value: progress ? String(progress.coins) : '—', icon: 'diamond' as const, color: colors.cyan }];
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [hasUnread,setHasUnread]=useState(false);
  useFocusEffect(useCallback(()=>{let active=true;void socialSummaryRepository.get().then(value=>{if(active)setHasUnread(value.unreadNotifications>0)}).catch(()=>undefined);return()=>{active=false}},[]));
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
      <View style={styles.identity}>
        <View style={styles.avatar}>{profile?.avatar_url?<Image source={{uri:profile.avatar_url}} style={styles.avatarImage}/>:<Text style={styles.avatarText}>{initial}</Text>}<View style={styles.level}><Text style={styles.levelText}>{level ?? '—'}</Text></View></View>
        <View style={styles.player}>
          <Text numberOfLines={1} style={styles.name}>{name}</Text>
          <Text style={styles.welcome}>LEVEL {level ?? '—'}</Text>
          <View style={styles.xpTrack}><LinearGradient colors={[colors.lime, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpFill, { width: `${xpPercent}%` }]} /></View>
        </View>
      </View>
      <IconButton icon="notifications-outline" label="Notifications" badge={hasUnread} onPress={()=>router.push('/notifications')} />
      </View>
      <View style={styles.actions}>{resources.map((resource) => <ResourceCounter compact={compact} key={resource.label} resource={resource} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: 12, marginTop: 8, paddingHorizontal: 13, paddingVertical: 8, gap: 6, borderRadius: 18, backgroundColor: '#07100ED9', borderWidth: 1, borderColor: '#375048', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24372F', borderWidth: 1.5, borderColor: '#739E65', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.lime, fontSize: 16, fontWeight: '900' },
  avatarImage:{width:'100%',height:'100%',borderRadius:19},
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 20, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  player: { flex: 1, maxWidth: 145 }, welcome: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1 }, name: { color: colors.text, fontSize: 16, fontWeight: '900' },
  xpTrack: { width: 96, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginTop: 4 }, xpFill: { height: '100%' },
  actions: { position: 'absolute', right: 63, top: 10, flexDirection: 'row', alignItems: 'center', gap: 15 },
});
