import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { requireAccount } from '../lib/guest';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import Avatar from '../components/Avatar';

interface Creator {
  id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  island: string;
  follower_count: number;
  is_following: boolean;
}

export default function CreatorHubScreen() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: creatorData, error } = await supabase
        .from('creator_profiles')
        .select(`
          id,
          follower_count,
          profiles!inner (
            id,
            display_name,
            username,
            bio,
            avatar_url,
            island,
            is_creator
          )
        `)
        .eq('profiles.is_creator', true)
        .order('follower_count', { ascending: false });

      if (error) throw error;

      const { data: followingData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);

      const formattedCreators = (creatorData || []).map((cp: any) => ({
        id: cp.profiles.id,
        display_name: cp.profiles.display_name,
        username: cp.profiles.username,
        bio: cp.profiles.bio || 'No bio yet',
        avatar_url: cp.profiles.avatar_url,
        island: cp.profiles.island,
        follower_count: cp.follower_count || 0,
        is_following: followingIds.has(cp.profiles.id),
      }));

      setCreators(formattedCreators);
    } catch (e: any) {
      console.error('Failed to load creators:', e);
      Alert.alert('Something went wrong', 'Could not load creators');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (creatorId: string, isFollowing: boolean) => {
    if (!currentUserId) return;
    if (await requireAccount('follow creators')) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', creatorId);
        if (error) throw error;

        const { data: currentCount } = await supabase
          .from('creator_profiles')
          .select('follower_count')
          .eq('id', creatorId)
          .single();

        await supabase
          .from('creator_profiles')
          .update({ follower_count: Math.max(0, (currentCount?.follower_count || 1) - 1) })
          .eq('id', creatorId);
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: currentUserId, following_id: creatorId });
        if (error) throw error;

        const { data: currentCount } = await supabase
          .from('creator_profiles')
          .select('follower_count')
          .eq('id', creatorId)
          .single();

        await supabase
          .from('creator_profiles')
          .update({ follower_count: (currentCount?.follower_count || 0) + 1 })
          .eq('id', creatorId);
      }

      setCreators(creators.map(c =>
        c.id === creatorId ? { ...c, is_following: !isFollowing, follower_count: isFollowing ? c.follower_count - 1 : c.follower_count + 1 } : c
      ));
    } catch (e: any) {
      console.error('Follow/unfollow failed:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  useFocusEffect(useCallback(() => {
    loadCreators();
  }, []));

  if (loading) {
    return (
      <View style={s.wrap}>
        <ScreenBackdrop />
        <ActivityIndicator size="large" color={colors.sea} />
      </View>
    );
  }

  if (creators.length === 0) {
    return (
      <View style={s.wrap}>
        <ScreenBackdrop />
        <Text style={s.emptyTitle}>No creators yet</Text>
        <Text style={s.emptyText}>Be the first to turn on "I'm a creator" in your profile!</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={s.title}>Creator Hub ✨</Text>
        <Text style={s.subtitle}>Discover creators from around the Caribbean</Text>

        <View style={s.creatorsList}>
          {creators.map(creator => (
            <View key={creator.id} style={s.creatorCard}>
              <View style={s.cardHeader}>
                <Avatar
                  uri={creator.avatar_url}
                  letter={creator.display_name[0]}
                  size={56}
                  bgColor={colors.sky}
                />
                <View style={s.creatorInfo}>
                  <Text style={s.creatorName}>{creator.display_name}</Text>
                  <Text style={s.username}>@{creator.username}</Text>
                  <Text style={s.island}>🏝️ {creator.island}</Text>
                </View>
              </View>

              <Text style={s.bio}>{creator.bio}</Text>

              <View style={s.statsRow}>
                <View style={s.stat}>
                  <Text style={s.statNumber}>{creator.follower_count}</Text>
                  <Text style={s.statLabel}>Followers</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.followBtn, creator.is_following && s.followingBtn]}
                onPress={() => handleFollow(creator.id, creator.is_following)}
              >
                <Text style={[s.followBtnText, creator.is_following && s.followingBtnText]}>
                  {creator.is_following ? 'Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  creatorsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.seaDeep,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  creatorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  username: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  island: {
    fontSize: 11,
    color: colors.seaDeep,
    fontWeight: '600',
    marginTop: 3,
  },
  bio: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.sea,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: colors.sea,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.sea,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  followingBtnText: {
    color: colors.sea,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
