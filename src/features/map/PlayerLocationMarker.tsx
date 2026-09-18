import { StyleSheet, View } from 'react-native';
import { Circle, Marker, type LatLng } from 'react-native-maps';
import { colors } from '@/theme';

interface PlayerLocationMarkerProps {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export function PlayerLocationMarker({ latitude, longitude, accuracy }: PlayerLocationMarkerProps) {
  const coordinate: LatLng = { latitude, longitude };
  const hasAccuracy = accuracy !== null && Number.isFinite(accuracy) && accuracy > 0;

  return (
    <>
      {hasAccuracy ? (
        <Circle
          center={coordinate}
          fillColor="#37D8D124"
          radius={accuracy}
          strokeColor="#71F3ED88"
          strokeWidth={1}
          zIndex={1}
        />
      ) : null}
      <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={coordinate} tracksViewChanges={false} zIndex={20}>
        <View style={styles.glow}>
          <View style={styles.outerRing}>
            <View style={styles.dot} />
          </View>
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  glow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#37D8D13D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9FFFC99',
    backgroundColor: '#37D8D12B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.cyan,
    borderWidth: 2.5,
    borderColor: '#E9FFFF',
    shadowColor: colors.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 7,
    elevation: 8,
  },
});
