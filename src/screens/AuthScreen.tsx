import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import CaribbeanBackdrop from '../components/CaribbeanBackdrop';
import { takeAuthMode } from '../lib/guest';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(takeAuthMode);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || password.length < 8) {
      Alert.alert('Hold up', 'Enter your email and a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) {
        console.error('Sign up failed:', error);
        Alert.alert('Something went wrong', error.message);
        return;
      }
      if (!data.session) {
        Alert.alert('Check your email', `We sent a confirmation link to ${email}. Confirm it, then come back and sign in.`);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        console.error('Sign in failed:', error);
        Alert.alert('Something went wrong', error.message);
      }
    }
  };

  const exploreAsGuest = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInAnonymously();
    setBusy(false);
    if (error) {
      console.error('Guest sign in failed:', error);
      Alert.alert('Something went wrong', error.message);
    }
  };

  return (
    <View style={s.root}>
      <CaribbeanBackdrop />
      <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.card}>
          <Text style={s.logo}>LIME<Text style={{ color: colors.mango }}>.</Text></Text>
          <Text style={s.tag}>De whole Caribbean, one yard.</Text>
          <TextInput style={s.input} placeholder="Email" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password (8+ characters)" placeholderTextColor="#EAF6F2"
            secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
            <Text style={s.btnText}>{busy ? '…' : mode === 'signup' ? 'Join de yard' : 'Come back in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            <Text style={s.switch}>
              {mode === 'signup' ? 'Already a cousin? Sign in' : 'New here? Create account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exploreAsGuest} disabled={busy}>
            <Text style={s.guest}>Explore as Guest</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.seaDeep },
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 28,
    padding: 28,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : null),
  },
  logo: { fontSize: 54, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  tag: { color: '#EAF6F2', textAlign: 'center', marginBottom: 32, marginTop: 4, fontSize: 15, fontWeight: '500' },
  input: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1.5,
    borderRadius: 16, padding: 15, color: '#fff', marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: colors.hibiscus, borderRadius: 999, padding: 16, marginTop: 8,
    shadowColor: colors.hibiscus, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  switch: { color: colors.mango, textAlign: 'center', marginTop: 18, fontWeight: '700' },
  guest: { color: '#EAF6F2', textAlign: 'center', marginTop: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
