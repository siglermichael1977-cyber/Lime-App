import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';

// Returns the new public audio URL, or null if the user canceled the picker.
// Throws with a precise message on any upload failure.
export async function pickAndUploadAudio(userId: string): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', base64: false });
  if (res.canceled) return null;

  const asset = res.assets[0];
  const ext = asset.mimeType?.split('/')[1] || 'mp3';
  const fileName = `${userId}/${Date.now()}.${ext}`;
  const file = await fetch(asset.uri).then(r => r.arrayBuffer());
  const { error: upErr } = await supabase.storage.from('culture-audio')
    .upload(fileName, file, { contentType: asset.mimeType || 'audio/mpeg' });
  if (upErr) throw new Error(`Audio upload failed: ${upErr.message}`);

  return supabase.storage.from('culture-audio').getPublicUrl(fileName).data.publicUrl;
}
