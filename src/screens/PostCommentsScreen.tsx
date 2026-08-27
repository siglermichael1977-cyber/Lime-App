import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors, islandColor } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import Avatar from '../components/Avatar';

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null; island: string };
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PostCommentsScreen() {
  const route = useRoute<any>();
  const postId = route.params?.postId as string;
  const [comments, setComments] = useState<Comment[]>([]);
  const [myId, setMyId] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);
    const { data, error } = await supabase.from('comments')
      .select('*, profiles!comments_author_id_fkey(display_name, avatar_url, island)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Failed to load comments:', error); return; }
    setComments(data ?? []);
  }, [postId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user!.id,
        body: body.trim(),
      });
      if (error) throw error;
      setBody('');
      load();
    } catch (e: any) {
      console.error('Failed to post comment:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (comment: Comment) => {
    try {
      // .select() forces Postgres to return the deleted row(s) — without it, a
      // delete blocked entirely by RLS (e.g. author_id mismatch) still comes back
      // as { error: null }, since zero-rows-matched isn't itself an error. That
      // would silently no-op: the comment reappears on reload with no feedback.
      const { data, error } = await supabase.from('comments').delete().eq('id', comment.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Couldn't delete that comment — you may not have permission.");
      }
      load();
    } catch (e: any) {
      console.error('Failed to delete comment:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  const confirmDelete = (comment: Comment) => {
    Alert.alert('Delete this comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(comment) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenBackdrop />
      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Avatar uri={item.profiles?.avatar_url} letter={(item.profiles?.display_name ?? '?')[0]} size={32}
              bgColor={islandColor(item.profiles?.island ?? '')} borderWidth={2} borderColor={colors.mango} />
            <View style={{ flex: 1 }}>
              <View style={s.headRow}>
                <Text style={s.name}>{item.profiles?.display_name ?? 'Cousin'}</Text>
                <Text style={s.time}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={s.body}>{item.body}</Text>
            </View>
            {item.author_id === myId && (
              <TouchableOpacity onPress={() => confirmDelete(item)}>
                <Text style={s.delete}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No comments yet — say something nice. 💬</Text>}
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
      />
      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder="Write a comment…" placeholderTextColor="#8FA6A1"
          value={body} onChangeText={setBody} multiline maxLength={1000} />
        <TouchableOpacity style={s.sendBtn} onPress={submit} disabled={busy || !body.trim()}>
          <Text style={s.sendBtnText}>{busy ? '…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.line, borderWidth: 1, borderRadius: 16, marginBottom: 10, padding: 12,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', fontSize: 13, color: colors.ink },
  time: { fontSize: 11, color: colors.muted },
  body: { fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 3 },
  delete: { fontSize: 16, marginLeft: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 40, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 12,
    paddingBottom: Platform.OS === 'web' ? 110 : 12,
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: 'rgba(255,255,255,0.95)' },
  input: { flex: 1, backgroundColor: colors.foam, borderColor: colors.line, borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.sea, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
