import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, Modal, StyleSheet, Share, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors, islandColor } from '../theme';
import { Post } from '../lib/types';
import Avatar from './Avatar';
import { openExternal } from '../lib/openExternal';
import { whatsappShareUrl } from '../lib/socialLinks';

const EDIT_TAGS = ['food', 'music'];

function storagePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

export default function PostCard({ post, myId, onChanged }: {
  post: Post; myId: string; onChanged: () => void;
}) {
  const nav = useNavigation<any>();
  const liked = post.post_likes?.some(l => l.user_id === myId);
  const likeCount = post.post_likes?.length ?? 0;
  const author = post.profiles;
  const isOwnPost = post.author_id === myId;
  const [showEdit, setShowEdit] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [editTags, setEditTags] = useState<string[]>(post.tags ?? []);
  const [editBusy, setEditBusy] = useState(false);

  const toggleLike = async () => {
    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: myId });
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: myId });
    }
    onChanged();
  };

  // WhatsApp / anywhere sharing via the native share sheet —
  // this is the compliant way to "sync" a post out to WhatsApp.
  const shareOut = () => {
    Share.share({ message: `${author?.display_name} on LIME 🌴\n\n${post.body}` });
  };

  const shareToWhatsapp = () => {
    openExternal(whatsappShareUrl(`${author?.display_name} on LIME 🌴\n\n${post.body}`));
  };

  const report = () => {
    Alert.alert('Report this post?', 'Our moderation team will review it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report', style: 'destructive',
        onPress: async () => {
          await supabase.from('reports').insert({
            reporter_id: myId, content_type: 'post', content_id: post.id, reason: 'user_report',
          });
          Alert.alert('Reported', 'Thanks — we will review it.');
        },
      },
      {
        text: 'Block user', style: 'destructive',
        onPress: async () => {
          await supabase.from('blocked_users').insert({ blocker_id: myId, blocked_id: post.author_id });
          onChanged();
        },
      },
    ]);
  };

  const deletePost = async () => {
    try {
      // Media cleanup is best-effort and must never block deleting the post row
      // itself — a malformed/partial image_url or video_url (e.g. a post left
      // over from a failed upload) should still let the user remove the post.
      if (post.image_url) {
        try {
          const path = storagePathFromPublicUrl(post.image_url, 'post-images');
          if (path) {
            const { error } = await supabase.storage.from('post-images').remove([path]);
            if (error) console.error('Failed to delete post image from storage:', error);
          }
        } catch (e) {
          console.error('Failed to clean up post image:', e);
        }
      }
      if (post.video_url) {
        try {
          const path = storagePathFromPublicUrl(post.video_url, 'post-videos');
          if (path) {
            const { error } = await supabase.storage.from('post-videos').remove([path]);
            if (error) console.error('Failed to delete post video from storage:', error);
          }
        } catch (e) {
          console.error('Failed to clean up post video:', e);
        }
      }
      // .select() forces Postgres to return the deleted row — without it, a
      // delete blocked entirely by RLS still comes back as { error: null },
      // since zero-rows-matched isn't itself an error. That would silently
      // no-op: the post reappears on reload with no feedback at all.
      const { data, error } = await supabase.from('posts').delete().eq('id', post.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Couldn't delete that post — you may not have permission.");
      }
      onChanged();
    } catch (e: any) {
      console.error('Failed to delete post:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deletePost },
    ]);
  };

  const startEdit = () => {
    setEditBody(post.body);
    setEditTags(post.tags ?? []);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editBody.trim()) {
      Alert.alert('Write something first 🙂');
      return;
    }
    setEditBusy(true);
    try {
      const { error } = await supabase.from('posts')
        .update({ body: editBody.trim(), tags: editTags })
        .eq('id', post.id);
      if (error) throw error;
      setShowEdit(false);
      onChanged();
    } catch (e: any) {
      console.error('Failed to update post:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setEditBusy(false);
    }
  };

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Avatar uri={author?.avatar_url} letter={(author?.display_name ?? '?')[0]} size={36}
          bgColor={islandColor(post.island)} borderWidth={2} borderColor={colors.mango} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{author?.display_name ?? 'Cousin'}</Text>
          <Text style={s.meta}>
            {post.posted_from === 'Home' ? '🏝️ Home' : `✈️ ${post.posted_from}`}
            {post.edited_at ? ' · edited' : ''}
          </Text>
        </View>
        <View style={s.tag}><Text style={s.tagText}>{post.island}</Text></View>
      </View>
      {post.image_url && <Image source={{ uri: post.image_url }} style={s.img} />}
      {post.video_url && Platform.OS === 'web' &&
        React.createElement('video', {
          src: post.video_url,
          controls: true,
          playsInline: true,
          preload: 'metadata',
          style: { width: '100%', maxHeight: 320, borderRadius: 12, marginBottom: 10, backgroundColor: '#000' },
        })}
      <Text style={s.body}>{post.body}</Text>
      <View style={s.actions}>
        <TouchableOpacity onPress={toggleLike}>
          <Text style={[s.action, liked && { color: colors.hibiscus }]}>
            🔥 Big up{likeCount > 0 ? ` ${likeCount}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('PostComments', { postId: post.id })}>
          <Text style={s.action}>💬 Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareOut}><Text style={s.action}>🔁 Pass it on</Text></TouchableOpacity>
        <TouchableOpacity onPress={shareToWhatsapp}><Text style={s.action}>📤 WhatsApp</Text></TouchableOpacity>
        {isOwnPost ? (
          <>
            <TouchableOpacity onPress={startEdit}>
              <Text style={s.action}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete}>
              <Text style={s.action}>🗑️ Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={report}>
            <Text style={s.action}>⋯ More</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Edit post</Text>
            <TextInput style={s.editInput} multiline maxLength={2000}
              value={editBody} onChangeText={setEditBody} placeholder="Wah gwaan?" placeholderTextColor="#8FA6A1" />
            <View style={s.editTagsRow}>
              {EDIT_TAGS.map(t => (
                <TouchableOpacity key={t}
                  style={[s.editTag, editTags.includes(t) && s.editTagOn]}
                  onPress={() => setEditTags(editTags.includes(t) ? editTags.filter(x => x !== t) : [...editTags, t])}>
                  <Text style={[s.editTagText, editTags.includes(t) && { color: colors.seaDeep }]}>#{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveEdit} disabled={editBusy}>
                <Text style={s.saveBtnText}>{editBusy ? '…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 18,
    marginHorizontal: 14, marginBottom: 14, padding: 16,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  name: { fontWeight: '700', fontSize: 14, color: colors.ink },
  meta: { fontSize: 11, color: colors.muted },
  tag: { backgroundColor: colors.sky, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9 },
  tagText: { fontSize: 10, fontWeight: '700', color: colors.seaDeep },
  img: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  body: { fontSize: 14.5, lineHeight: 21, color: colors.ink, marginBottom: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' },
  action: { fontSize: 12.5, fontWeight: '600', color: '#41615B' },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(9,63,58,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22,
    paddingBottom: Platform.OS === 'web' ? 110 : 40 },
  sheetH: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: colors.ink },
  editInput: { backgroundColor: colors.foam, borderColor: colors.line, borderWidth: 1.5, borderRadius: 16,
    padding: 14, minHeight: 120, fontSize: 15, textAlignVertical: 'top', color: colors.ink },
  editTagsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  editTag: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.foam, borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14 },
  editTagOn: { backgroundColor: colors.sky, borderColor: colors.sea },
  editTagText: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: 999, padding: 14 },
  cancelBtnText: { textAlign: 'center', fontWeight: '700', color: colors.muted },
  saveBtn: { flex: 1, backgroundColor: colors.sea, borderRadius: 999, padding: 14 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
});
