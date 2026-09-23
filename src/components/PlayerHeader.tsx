import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from '@/components/IconButton';
import { ResourceCounter } from '@/components/ResourceCounter';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, radius, spacing } from '@/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { socialSummaryRepository } from '@/services/backend/socialSummaryRepository';

export function PlayerHeader() {
  const { profile, progress } = useAuth();
  const name = profile?.display_name || profile?.username || 'Player'; const level = progress?.level; const initial = name.slice(0, 1).toUpperCase(); const xpPercent = progress ? Math.min(100, progress.xp % 1000 / 10) : 0; const resources = [{ label: 'Energy', value: progress ? String(progress.energy) : '—', icon: 'flash' as const, color: colors.gold }, { label: 'Coins', value: progress ? String(progress.coins) : '—', icon: 'diamond' as const, color: colors.cyan }];
  const [hasUnread,setHasUnread]=useState(false);
  useFocusEffect(useCallback(()=>{let active=true;void socialSummaryRepository.get().then(value=>{if(active)setHasUnread(value.unreadNotifications>0)}).catch(()=>undefined);return()=>{active=false}},[]));
  return (
    <View pointerEvents="box-none" style={styles.header}>
      <Pressable accessibilityLabel={`Open profile. Level ${level ?? 'unknown'}`} accessibilityRole="button" onPress={()=>router.push('/profile')} style={styles.identity}>
        <View style={styles.avatar}>{profile?.avatar_url?<Image source={{uri:profile.avatar_url}} style={styles.avatarImage}/>:<Text style={styles.avatarText}>{initial}</Text>}<View style={styles.level}><Text style={styles.levelText}>{level ?? '—'}</Text></View></View>
        <View style={styles.xpTrack}><LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpFill, { width: `${xpPercent}%` }]} /></View>
      </Pressable>
      <View style={styles.actions}>{resources.map((resource) => <ResourceCounter compact key={resource.label} resource={resource} />)}<IconButton icon="notifications-outline" label="Notifications" badge={hasUnread} onPress={()=>router.push('/notifications')} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginHorizontal: spacing.md, marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { width: 48, height: 48, borderRadius: radius.pill, padding: 4, backgroundColor: colors.mapOverlay, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24372F', borderWidth: 1.5, borderColor: '#739E65', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.lime, fontSize: 16, fontWeight: '900' },
  avatarImage:{width:'100%',height:'100%',borderRadius:19},
  level: { position: 'absolute', right: -5, bottom: -4, backgroundColor: colors.lime, borderRadius: 8, minWidth: 20, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  levelText: { fontSize: 9, fontWeight: '900', color: colors.background },
  xpTrack: { position:'absolute', left: 7, right: 7, bottom: 2, height: 2, borderRadius: 1, backgroundColor: colors.border, overflow: 'hidden' }, xpFill: { height: '100%' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
