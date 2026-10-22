import { Alert } from 'react-native';
import { supabase } from './supabase';

// Guests are anonymous Supabase users: they have a session but no profile row.
export async function isGuest(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.is_anonymous ?? false;
}

// The mode AuthScreen opens in after a guest leaves; read once on mount.
let nextAuthMode: 'signin' | 'signup' = 'signup';
export function takeAuthMode(): 'signin' | 'signup' {
  const mode = nextAuthMode;
  nextAuthMode = 'signup';
  return mode;
}

// Ends the guest session and lands on AuthScreen in the given mode.
export function leaveGuest(mode: 'signin' | 'signup') {
  nextAuthMode = mode;
  supabase.auth.signOut();
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
