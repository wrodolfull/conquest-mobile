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
        />
      ) : null}
      <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={coordinate} tracksViewChanges={false}>
        <View style={styles.glow}>
          <View style={styles.dot} />
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  glow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#37D8D135',
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
