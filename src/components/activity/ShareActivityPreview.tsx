import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { ActivityShareModel } from '@/features/activity/shareModel';
import { colors } from '@/theme';
import { ShareActivityCard } from './ShareActivityCard';

interface ShareActivityPreviewProps { model: ActivityShareModel; visible: boolean; onClose: () => void }

export function ShareActivityPreview({ model, visible, onClose }: ShareActivityPreviewProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device.');
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Ruqest activity', UTI: 'public.png' });
    } catch (error) {
      Alert.alert('Unable to share', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSharing(false); }
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>SHARE ACTIVITY</Text><Text style={styles.title}>Preview</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close share preview" onPress={onClose}><Text style={styles.close}>CLOSE</Text></Pressable></View>
      <View style={styles.preview}><View ref={cardRef} collapsable={false}><ShareActivityCard model={model} /></View></View>
      <View style={styles.privacy}><Text style={styles.privacyTitle}>PRIVATE BY DEFAULT</Text><Text style={styles.privacyCopy}>Your exact GPS route and account details are not included.</Text><View style={styles.futureOption}><View style={styles.offSwitch}><View style={styles.offKnob} /></View><Text style={styles.disabled}>Include route · Coming later</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Share activity image" disabled={sharing} onPress={() => void share()} style={({ pressed }) => [styles.share, pressed && styles.pressed]}>{sharing ? <ActivityIndicator color={colors.background} /> : <Text style={styles.shareText}>SHARE IMAGE</Text>}</Pressable>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' }, close: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.92 }] },
  privacy: { padding: 14, borderRadius: 15, backgroundColor: colors.surface }, privacyTitle: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, privacyCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  futureOption: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }, offSwitch: { width: 30, height: 17, borderRadius: 9, padding: 2, backgroundColor: colors.border }, offKnob: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.muted }, disabled: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  share: { height: 56, marginTop: 12, borderRadius: 17, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, shareText: { color: colors.background, fontSize: 14, fontWeight: '900' }, pressed: { opacity: 0.75 },
});
