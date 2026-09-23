import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

interface Props { children: ReactNode }
interface State { failed: boolean }

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.warn('Native map failed to render', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.fallback}>
          <Ionicons name="map-outline" color={colors.lime} size={34} />
          <Text style={styles.title}>MAP TEMPORARILY UNAVAILABLE</Text>
          <Text style={styles.message}>Update Expo Go and reload the project. Your activities and the rest of Ruqest are still available.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#10201C', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42 },
  title: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  message: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8 },
});
