import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme';
export default function AuthCallback() { const { session, loading } = useAuth(); if (loading) return <View style={styles.screen}><ActivityIndicator color={colors.lime}/></View>; return <Redirect href={session ? '/map' : '/(auth)/sign-in'} />; }
const styles=StyleSheet.create({screen:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background}});
