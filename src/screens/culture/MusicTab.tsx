import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { colors, islandColor } from '../../theme';
import { CultureMusic } from '../../lib/types';
import { openExternal } from '../../lib/openExternal';
import { pickAndUploadAudio } from '../../lib/audioUpload';

export default function MusicTab() {
  const [tracks, setTracks] = useState<CultureMusic[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('culture_music')
      .select('*, profiles!culture_music_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.error('Failed to load music:', error); return; }
    setTracks(data ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const uploadAudio = async () => {
    setAudioBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await pickAndUploadAudio(user!.id);
      if (url) setAudioUrl(url);
    } catch (e: any) {
      console.error('Failed to upload audio:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setAudioBusy(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !artist.trim()) {
      Alert.alert('Almost there', 'Add a title and artist.');
      return;
    }
    if (!audioUrl && !externalUrl.trim()) {
      Alert.alert('Almost there', 'Upload audio or paste a link (Spotify, YouTube, Apple Music, SoundCloud).');
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('culture_music').insert({
        author_id: user!.id,
        title: title.trim(),
        artist: artist.trim(),
        audio_url: audioUrl,
        external_url: externalUrl.trim() || null,
      });
      if (error) throw error;
      setShow(false); setTitle(''); setArtist(''); setExternalUrl(''); setAudioUrl(null);
      load();
    } catch (e: any) {
      console.error('Failed to share music:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={tracks}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.head}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.meta}>{item.artist} · {item.profiles?.display_name ?? 'Cousin'}</Text>
              </View>
              {item.profiles?.island && (
                <View style={[s.tag, { backgroundColor: islandColor(item.profiles.island) }]}>
                  <Text style={s.tagText}>{item.profiles.island}</Text>
                </View>
              )}
            </View>
            {item.audio_url && Platform.OS === 'web' &&
              React.createElement('audio', { src: item.audio_url, controls: true, style: { width: '100%', marginTop: 10 } })}
            {item.external_url && (
              <TouchableOpacity style={s.playBtn} onPress={() => openExternal(item.external_url!)}>
                <Text style={s.playBtnText}>▶ Listen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No music shared yet — be the first. 🎵</Text>}
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 6 }}
      />
      <TouchableOpacity style={s.fab} onPress={() => setShow(true)}>
        <Text style={s.fabText}>+ Share music</Text>
      </TouchableOpacity>

      <Modal visible={show} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Share music 🎵</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor="#8FA6A1"
              value={title} onChangeText={setTitle} />
            <TextInput style={s.input} placeholder="Artist / creator" placeholderTextColor="#8FA6A1"
              value={artist} onChangeText={setArtist} />
            <TextInput style={s.input} placeholder="Spotify / YouTube / Apple Music / SoundCloud link"
              placeholderTextColor="#8FA6A1" autoCapitalize="none" value={externalUrl} onChangeText={setExternalUrl} />
            <TouchableOpacity style={s.ghost} onPress={uploadAudio} disabled={audioBusy}>
              <Text style={s.ghostText}>{audioBusy ? 'Uploading…' : audioUrl ? '🎵 Audio attached — tap to change' : '🎵 Or upload your own audio'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={s.ghostBtn} onPress={() => setShow(false)}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
                <Text style={s.btnText}>{busy ? '…' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 16,
    marginHorizontal: 14, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  tag: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  playBtn: { backgroundColor: colors.sea, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15,
    alignSelf: 'flex-start', marginTop: 10 },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 40, lineHeight: 20 },
  fab: { position: 'absolute', bottom: Platform.OS === 'web' ? 90 : 20, alignSelf: 'center', backgroundColor: colors.hibiscus,
    borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(9,63,58,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22,
    paddingBottom: Platform.OS === 'web' ? 110 : 40 },
  sheetH: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: colors.ink },
  input: { backgroundColor: colors.foam, borderColor: colors.line, borderWidth: 1.5, borderRadius: 14,
    padding: 13, marginBottom: 10, fontSize: 14, color: colors.ink },
  ghost: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.foam, borderRadius: 14,
    padding: 13, marginBottom: 4 },
  ghostText: { fontSize: 13, fontWeight: '600', color: colors.muted, textAlign: 'center' },
  btn: { flex: 1, backgroundColor: colors.sea, borderRadius: 999, padding: 14 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  ghostBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: 999, padding: 14 },
  ghostBtnText: { textAlign: 'center', fontWeight: '700', color: colors.muted },
});
