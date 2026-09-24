import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface Props extends PropsWithChildren { eyebrow: string; title: string; canGoBack?: boolean; variant?: 'default' | 'immersive' }

export function ActivityFlowShell({ children, eyebrow, title, canGoBack = true, variant = 'default' }: Props) {
  const body = variant === 'immersive' ? <View style={styles.immersive}>{children}</View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
  return <SafeAreaView style={styles.safe}><View style={[styles.header, variant === 'immersive' && styles.compactHeader]}>{canGoBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable> : <View style={styles.spacer} />}<View style={styles.heading}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><View style={styles.spacer} /></View>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { height: 68, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, compactHeader: { height: 58 }, back: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, spacer: { width: 44, height: 44 }, heading: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 }, content: { flexGrow: 1, padding: 20, paddingBottom: 36 }, immersive: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 } });
