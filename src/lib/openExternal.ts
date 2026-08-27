import { Linking, Platform } from 'react-native';

export function openExternal(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  }
}
