import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

interface Props { children: ReactNode }
interface State { failed: boolean; resetKey: number }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('[App] Unexpected render failure.', error, info.componentStack);
  }

  private reset = () => this.setState((state) => ({ failed: false, resetKey: state.resetKey + 1 }));

  render() {
    if (this.state.failed) return (
      <View style={styles.fallback}>
        <Text style={styles.title}>SOMETHING WENT WRONG</Text>
        <Text style={styles.message}>Ruqest hit an unexpected problem. Your locally recorded activity data is still safe.</Text>
        <Pressable accessibilityRole="button" onPress={this.reset} style={styles.button}><Text style={styles.buttonText}>TRY AGAIN</Text></Pressable>
      </View>
    );
    return <View key={this.state.resetKey} style={styles.container}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  message: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12, textAlign: 'center' },
  button: { marginTop: 24, minWidth: 150, alignItems: 'center', borderRadius: 12, padding: 14, backgroundColor: colors.lime },
  buttonText: { color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
