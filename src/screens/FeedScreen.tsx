import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { requireAccount } from '../lib/guest';
import { colors } from '../theme';
import { Post, Profile } from '../lib/types';
import PostCard from '../components/PostCard';
import ScreenBackdrop from '../components/ScreenBackdrop';

const FILTERS = [
  { key: 'all', label: 'All de yard' },
  { key: 'mine', label: 'My island' },
  { key: 'abroad', label: 'Foreign massive' },
  { key: 'food', label: 'Food 🍲' },
  { key: 'music', label: 'Music 🎶' },
];

export default function FeedScreen() {
  const nav = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileError) console.error('Failed to load profile:', profileError);
    setMe(profile);

    let q = supabase.from('posts')
      .select('*, profiles!posts_author_id_fkey(*), post_likes(user_id)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (filter === 'mine' && profile) q = q.eq('island', profile.island);
    if (filter === 'abroad') q = q.neq('posted_from', 'Home');
    if (filter === 'food' || filter === 'music') q = q.contains('tags', [filter]);
    const { data, error } = await q;
    if (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
      return;
    }
    setPosts(data ?? []);
  }, [filter]);

  // Compose always nav.goBack()s to here on success, which alone triggers this
  // focus-driven reload — a second reload wired to the post-created event used
  // to fire concurrently with it, racing two overlapping fetches against each
  // other for no benefit and a real chance of a double-render flash.
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [filter]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <View style={s.bar}>
        <Text style={s.logo}>LIME<Text style={{ color: colors.mango }}>.</Text></Text>
        <TouchableOpacity style={s.compose} onPress={async () => {
          if (await requireAccount('post')) return;
          nav.navigate('Compose');
        }}>
          <Text style={s.composeText}>＋ Post</Text>
        </TouchableOpacity>
      </View>
      <View style={s.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[s.pill, filter === f.key && s.pillOn]}
            onPress={() => setFilter(f.key)}>
            <Text style={[s.pillText, filter === f.key && s.pillTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <PostCard post={item} myId={me?.id ?? ''} onChanged={load} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={s.empty}>Nothing here yet — somebody has to start the lime. 🌴</Text>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 54 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, marginBottom: 8 },
  logo: { fontSize: 26, fontWeight: '800', color: colors.seaDeep },
  compose: { backgroundColor: colors.hibiscus, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  composeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 12 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 13 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  pillTextOn: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 30, lineHeight: 22 },
});
