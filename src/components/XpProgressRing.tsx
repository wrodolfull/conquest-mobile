import { StyleSheet, View } from 'react-native';
import { xpRingSegmentCount, XP_RING_SEGMENTS } from '@/features/home/xpProgress';
import { colors } from '@/theme';

const SIZE = 46;
const CENTER = SIZE / 2;
const RADIUS = 21;

export function XpProgressRing({ percent }: { percent: number }) {
  const filled = xpRingSegmentCount(percent);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.ring}>
      {Array.from({ length: XP_RING_SEGMENTS }, (_, index) => {
        const angle = (index / XP_RING_SEGMENTS) * Math.PI * 2 - Math.PI / 2;
        return <View key={index} style={[styles.segment, {
          backgroundColor: index < filled ? (index < XP_RING_SEGMENTS / 2 ? colors.lime : colors.cyan) : colors.border,
          left: CENTER + Math.cos(angle) * RADIUS - 1,
          top: CENTER + Math.sin(angle) * RADIUS - 2,
          transform: [{ rotate: `${(index / XP_RING_SEGMENTS) * 360}deg` }],
        }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { ...StyleSheet.absoluteFillObject },
  segment: { position: 'absolute', width: 2, height: 4, borderRadius: 2 },
});
