import { Alert } from 'react-native';
import { supabase } from './supabase';
import { requireAccount } from './guest';

// Must match the reports.content_type check (see supabase/review_fixes_23.sql).
export type ReportContentType =
  'post' | 'comment' | 'profile' | 'event' | 'property_listing' | 'poem' | 'music' | 'story';

// IDs of users the signed-in user has blocked. Guests can't block, so they get an empty set.
export async function fetchBlockedIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return new Set();
  const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id);
  if (error) {
    console.error('Failed to load blocked users:', error);
    return new Set();
  }
  return new Set((data ?? []).map(b => b.blocked_id));
}

// The ⋯ menu for someone else's content: report it, or block its author.
// onBlocked runs after a successful block so the screen can reload without them.
export async function openReportBlockMenu({ contentType, contentId, authorId, authorName, onBlocked }: {
  contentType: ReportContentType;
  contentId: string;
  authorId: string;
  authorName?: string | null;
  onBlocked: () => void;
}) {
  if (await requireAccount('report content or block users')) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = authorName ?? 'this user';

  Alert.alert('Report or block', 'Our moderation team reviews every report within 24 hours.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Report', style: 'destructive',
      onPress: async () => {
        const { error } = await supabase.from('reports').insert({
          reporter_id: user.id, content_type: contentType, content_id: contentId, reason: 'user_report',
        });
        if (error) {
          console.error('Failed to report content:', error);
          Alert.alert('Something went wrong', error.message);
          return;
        }
        Alert.alert('Reported', 'Thanks — we will review it.');
      },
    },
    {
      text: 'Block user', style: 'destructive',
      onPress: async () => {
        const { error } = await supabase.from('blocked_users')
          .upsert({ blocker_id: user.id, blocked_id: authorId });
        if (error) {
          console.error('Failed to block user:', error);
          Alert.alert('Something went wrong', error.message);
          return;
        }
        Alert.alert('Blocked', `You won't see anything from ${name} anymore.`);
        onBlocked();
      },
    },
  ]);
}
