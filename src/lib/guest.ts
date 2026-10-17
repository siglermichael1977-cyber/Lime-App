import { Alert } from 'react-native';
import { supabase } from './supabase';

// Guests are anonymous Supabase users: they have a session but no profile row.
export async function isGuest(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.is_anonymous ?? false;
}

// Shows the create-account prompt and returns true when the user is a guest,
// so callers can bail out with `if (await requireAccount('post')) return;`.
// Signing out lands on AuthScreen, which opens in sign-up mode.
export async function requireAccount(action: string): Promise<boolean> {
  if (!(await isGuest())) return false;
  Alert.alert('Create an account', `You need an account to ${action}. It only takes a minute.`, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Sign up', onPress: () => { supabase.auth.signOut(); } },
  ]);
  return true;
}
