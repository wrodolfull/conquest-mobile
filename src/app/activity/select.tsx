import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityFlowShell } from '@/components/ActivityFlowShell';
import { ActivitySelector } from '@/components/ActivitySelector';
import { colors } from '@/theme';

export default function SelectActivityScreen() {
  return <ActivityFlowShell eyebrow="NEW SESSION" title="Choose activity"><View style={styles.hero}><Text style={styles.heroTitle}>How are you moving?</Text><Text style={styles.copy}>Pick a mode, then put your phone away. This prototype safely simulates your progress.</Text></View><ActivitySelector onSelect={(type) => router.replace({ pathname: '/activity/active', params: { type } })} /><View style={styles.note}><Text style={styles.noteTitle}>MOCK TRACKING</Text><Text style={styles.noteCopy}>No GPS, health data, or backend connection is used.</Text></View></ActivityFlowShell>;
}
const styles = StyleSheet.create({ hero: { marginTop: 24, marginBottom: 28 }, heroTitle: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '900' }, copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 }, note: { marginTop: 24, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, backgroundColor: colors.surface }, noteTitle: { color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, noteCopy: { color: colors.muted, marginTop: 6, lineHeight: 20 } });
