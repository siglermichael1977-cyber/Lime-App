import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { supabase } from './supabase';
import { normalizeToJpegUri } from './heicToJpeg';

const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.7;

async function compressAvatar(uri: string): Promise<string> {
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });
  const longestSide = Math.max(width, height);
  const actions = longestSide > MAX_DIMENSION
    ? [width >= height ? { resize: { width: MAX_DIMENSION } } : { resize: { height: MAX_DIMENSION } }]
    : [];
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

// Returns the new public avatar URL, or null if the user canceled the picker.
// Throws with a precise message on any upload failure.
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (res.canceled) return null;

  let uploadUri = await normalizeToJpegUri(res.assets[0].uri, res.assets[0].mimeType);
  try {
    uploadUri = await compressAvatar(uploadUri);
  } catch (e) {
    console.error('Avatar compression failed, uploading original:', e);
  }

  const fileName = `${userId}/avatar-${Date.now()}.jpg`;
  const file = await fetch(uploadUri).then(r => r.arrayBuffer());
  const { error: upErr } = await supabase.storage.from('avatars')
    .upload(fileName, file, { contentType: 'image/jpeg' });
  if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);

  return supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
}
