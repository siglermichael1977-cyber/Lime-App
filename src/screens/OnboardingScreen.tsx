import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, ISLANDS, LOOKING_FOR_OPTIONS } from '../theme';
import CaribbeanBackdrop from '../components/CaribbeanBackdrop';
import { pickAndUploadAvatar } from '../lib/avatarUpload';

const LOCATIONS = ['Home', 'USA', 'Canada', 'UK', 'Elsewhere'];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [island, setIsland] = useState<string | null>(null);
  const [where, setWhere] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [lookingFor, setLookingFor] = useState<string | null>(null);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [x, setX] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    setAvatarBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await pickAndUploadAvatar(user!.id);
      if (url) setAvatarUrl(url);
    } catch (e: any) {
      console.error('Failed to upload avatar:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const submit = async () => {
    if (!username || !displayName || !island || !where) {
      Alert.alert('Almost there', 'Fill in everything so de cousins know you.');
      return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').insert({
      id: user!.id,
      username: username.toLowerCase().trim(),
      display_name: displayName.trim(),
      island,
      current_location: where,
      avatar_url: avatarUrl,
      looking_for: lookingFor,
      instagram_url: instagram.trim() || null,
      facebook_url: facebook.trim() || null,
      tiktok_url: tiktok.trim() || null,
      x_url: x.trim() || null,
      whatsapp: whatsapp.trim() || null,
      phone: phone.trim() || null,
    });
    setBusy(false);
    if (error) {
      Alert.alert('Hmm', error.message.includes('unique') ? 'That username is taken — try another.' : error.message);
      return;
    }
    onDone();
  };

  return (
    <View style={s.root}>
      <CaribbeanBackdrop />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wrap}>
        <View style={s.card}>
          <TouchableOpacity style={s.photoPicker} onPress={pickPhoto} disabled={avatarBusy}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.photoPreview} />
            ) : (
              <Text style={s.photoIcon}>📷</Text>
            )}
          </TouchableOpacity>
          <Text style={s.photoLabel}>{avatarBusy ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add a profile photo'}</Text>
          <Text style={s.h}>Weh yuh from? 🌴</Text>
          <View style={s.chips}>
            {ISLANDS.map(i => (
              <TouchableOpacity key={i} style={[s.chip, island === i && s.chipOn]} onPress={() => setIsland(i)}>
                <Text style={[s.chipText, island === i && s.chipTextOn]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.h2}>And where yuh reach now?</Text>
          <View style={s.chips}>
            {LOCATIONS.map(l => (
              <TouchableOpacity key={l} style={[s.chip, where === l && s.chipOn]} onPress={() => setWhere(l)}>
                <Text style={[s.chipText, where === l && s.chipTextOn]}>{l === 'Home' ? '🏝️ Home on island' : l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.h2}>What's your vibe? (optional)</Text>
          <View style={s.chips}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <TouchableOpacity key={opt} style={[s.chip, lookingFor === opt && s.chipOn]}
                onPress={() => setLookingFor(lookingFor === opt ? null : opt)}>
                <Text style={[s.chipText, lookingFor === opt && s.chipTextOn]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.h2}>Connect your socials (optional)</Text>
          <Text style={s.socialsSub}>Skip anything you don't want to share — you can add it later too.</Text>
          <TextInput style={s.input} placeholder="Instagram (handle or link)" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" value={instagram} onChangeText={setInstagram} />
          <TextInput style={s.input} placeholder="Facebook (handle or link)" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" value={facebook} onChangeText={setFacebook} />
          <TextInput style={s.input} placeholder="TikTok (handle or link)" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" value={tiktok} onChangeText={setTiktok} />
          <TextInput style={s.input} placeholder="X / Twitter (handle or link)" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" value={x} onChangeText={setX} />
          <TextInput style={s.input} placeholder="WhatsApp number" placeholderTextColor="#EAF6F2"
            keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />
          <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#EAF6F2"
            keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <TextInput style={s.input} placeholder="Pick a username" placeholderTextColor="#EAF6F2"
            autoCapitalize="none" value={username} onChangeText={setUsername} />
          <TextInput style={s.input} placeholder="Your name" placeholderTextColor="#EAF6F2"
            value={displayName} onChangeText={setDisplayName} />
          <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
            <Text style={s.btnText}>{busy ? '…' : 'Come Lime →'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.seaDeep },
  wrap: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 28,
    padding: 24,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)' } as any) : null),
  },
  photoPicker: { width: 88, height: 88, borderRadius: 44, alignSelf: 'center', marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 2, borderColor: colors.mango,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoPreview: { width: 88, height: 88, borderRadius: 44 },
  photoIcon: { fontSize: 30 },
  photoLabel: { color: '#EAF6F2', fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  h: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  h2: { color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 14, textAlign: 'center' },
  socialsSub: { color: '#EAF6F2', fontSize: 12, textAlign: 'center', marginTop: -8, marginBottom: 4, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999, paddingVertical: 9, paddingHorizontal: 15 },
  chipOn: { backgroundColor: colors.mango, borderColor: colors.mango },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.ink, fontWeight: '800' },
  input: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1.5,
    borderRadius: 16, padding: 15, color: '#fff', marginTop: 12, fontSize: 15 },
  btn: { backgroundColor: colors.hibiscus, borderRadius: 999, padding: 16, marginTop: 20,
    shadowColor: colors.hibiscus, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});
