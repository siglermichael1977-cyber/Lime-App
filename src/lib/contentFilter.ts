import { Alert } from 'react-native';

// A deliberately small, conservative filter for slurs, explicit sexual terms and
// threats. Everything is whole-word matched, so everyday Caribbean talk
// ("wah gwaan", "bacchanal", "wine up", "tun up", "dis food go kill yuh") passes.
// Reports and blocking are the backstop for anything this misses.

const BLOCKED_WORDS = [
  // Slurs
  'nigger', 'niggers', 'nigga', 'niggas', 'faggot', 'faggots', 'fag', 'fags', 'tranny', 'trannies',
  'chink', 'chinks', 'spic', 'spics', 'kike', 'kikes', 'wetback', 'wetbacks', 'coon', 'coons',
  'coolie', 'coolies', 'retard', 'retards',
  'battyboy', 'battyboys', 'battyman', 'battymen', 'chichiman', 'chichimen',
  // Explicit sexual
  'porn', 'porno', 'pornhub', 'blowjob', 'blowjobs', 'handjob', 'handjobs', 'cumshot',
  'gangbang', 'dildo', 'dildos', 'nudes', 'rape', 'raped', 'rapist',
];

const BLOCKED_PHRASES = [
  /\bbatty\s+(boy|boys|man|men)\b/,
  /\bchi\s*chi\s+(man|men)\b/,
  /\bsend\s+nudes\b/,
  // First-person threats of violence. "Dis heat go kill yuh" is fine; "I'll kill you" isn't.
  /\b(i'?ll|i\s+will|i'?m\s+(going|gonna)\s+to|i'?m\s+gonna|gonna|imma|ima|mi\s+a\s+go|mi\s+go|i\s+go)\s+(kill|shoot|stab|murder|rape|chop)\s+(you|u|yuh|yu|unu|ya)\b/,
  /\b(go\s+)?kill\s+(yourself|yuhself|urself)\b/,
  /\bkys\b/,
];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a', '$': 's', '!': 'i' };

function normalize(text: string): string {
  return text.toLowerCase().replace(/[01345@$!]/g, c => LEET[c]).replace(/[’‘`]/g, "'");
}

const WORD_RE = new RegExp(`\\b(${BLOCKED_WORDS.join('|')})\\b`);

export function isObjectionable(...texts: (string | null | undefined)[]): boolean {
  const text = normalize(texts.filter(Boolean).join('\n'));
  return WORD_RE.test(text) || BLOCKED_PHRASES.some(re => re.test(text));
}

export const RESPECTFUL_MESSAGE = "Let's keep de yard respectful — please edit your post.";

// Shows the friendly message and returns true when the text should be blocked,
// so callers can bail out with `if (blockIfObjectionable(title, body)) return;`.
export function blockIfObjectionable(...texts: (string | null | undefined)[]): boolean {
  if (!isObjectionable(...texts)) return false;
  Alert.alert('Hold up 🌴', RESPECTFUL_MESSAGE);
  return true;
}
