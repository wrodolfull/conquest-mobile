import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
          <Text style={styles.message}>The rest of Ruqest is still available. Try reopening the map.</Text>
          <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={styles.button}><Text style={styles.buttonText}>TRY AGAIN</Text></Pressable>
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
  button: { marginTop: 18, borderRadius: 10, backgroundColor: colors.lime, paddingHorizontal: 20, paddingVertical: 11 },
  buttonText: { color: colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});
