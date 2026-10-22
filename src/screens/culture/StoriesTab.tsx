import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { requireAccount } from '../../lib/guest';
import { fetchBlockedIds, openReportBlockMenu } from '../../lib/moderation';
import { blockIfObjectionable } from '../../lib/contentFilter';
import { colors, islandColor } from '../../theme';
import { CultureStory } from '../../lib/types';
import { openExternal } from '../../lib/openExternal';
import Avatar from '../../components/Avatar';

export default function StoriesTab() {
  const [stories, setStories] = useState<CultureStory[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [myId, setMyId] = useState('');

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);
    const { data, error } = await supabase.from('culture_stories')
      .select('*, profiles!culture_stories_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.error('Failed to load stories:', error); return; }
    const blocked = await fetchBlockedIds();
    setStories((data ?? []).filter(st => !blocked.has(st.author_id)));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Almost there', 'Add a title.');
      return;
    }
    if (!body.trim() && !externalUrl.trim()) {
      Alert.alert('Almost there', 'Write your story, or paste a link to it.');
      return;
    }
    if (blockIfObjectionable(title, body, externalUrl)) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('culture_stories').insert({
        author_id: user!.id,
        title: title.trim(),
        body: body.trim() || null,
        external_url: externalUrl.trim() || null,
      });
      if (error) throw error;
      setShow(false); setTitle(''); setBody(''); setExternalUrl('');
      load();
    } catch (e: any) {
      console.error('Failed to share story:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={stories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.head}>
              <Avatar uri={item.profiles?.avatar_url} letter={(item.profiles?.display_name ?? '?')[0]} size={32}
                bgColor={islandColor(item.profiles?.island ?? '')} borderWidth={2} borderColor={colors.mango} />
              <View style={{ flex: 1 }}>
                <Text style={s.author}>{item.profiles?.display_name ?? 'Cousin'}</Text>
                <Text style={s.meta}>{item.profiles?.island}</Text>
              </View>
              {item.author_id !== myId && (
                <TouchableOpacity hitSlop={10} onPress={() => openReportBlockMenu({
                  contentType: 'story', contentId: item.id, authorId: item.author_id,
                  authorName: item.profiles?.display_name, onBlocked: load,
                })}>
                  <Text style={s.more}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.title}>{item.title}</Text>
            {item.body && <Text style={s.body}>{item.body}</Text>}
            {item.external_url && (
              <TouchableOpacity style={s.playBtn} onPress={() => openExternal(item.external_url!)}>
                <Text style={s.playBtnText}>🔗 Read more</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No stories shared yet — every family has one. 📖</Text>}
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 6 }}
      />
      <TouchableOpacity style={s.fab} onPress={async () => {
        if (await requireAccount('share a story')) return;
        setShow(true);
      }}>
        <Text style={s.fabText}>+ Share a story</Text>
      </TouchableOpacity>

      <Modal visible={show} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Share a story 📖</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor="#8FA6A1"
              value={title} onChangeText={setTitle} />
            <TextInput style={[s.input, s.textarea]} placeholder="Your story… (leave blank if just sharing a link)"
              placeholderTextColor="#8FA6A1" multiline value={body} onChangeText={setBody} />
            <TextInput style={s.input} placeholder="Link to a book, author, or folk tale (optional)"
              placeholderTextColor="#8FA6A1" autoCapitalize="none" value={externalUrl} onChangeText={setExternalUrl} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  author: { fontWeight: '700', fontSize: 13, color: colors.ink },
  more: { fontSize: 16, fontWeight: '700', color: '#41615B' },
  meta: { fontSize: 11, color: colors.muted },
  title: { fontWeight: '800', fontSize: 15, color: colors.seaDeep, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 21, color: colors.ink },
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
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  btn: { flex: 1, backgroundColor: colors.sea, borderRadius: 999, padding: 14 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  ghostBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: 999, padding: 14 },
  ghostBtnText: { textAlign: 'center', fontWeight: '700', color: colors.muted },
});
