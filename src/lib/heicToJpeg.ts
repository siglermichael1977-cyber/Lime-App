import { Platform } from 'react-native';

const HEIC_EXTENSION = /\.(heic|heif)$/i;

// Browsers (Chrome, Firefox, etc.) cannot decode HEIC/HEIF at all, so canvas-based
// compression silently fails on iPhone photos unless we convert to JPEG first.
// Native iOS/Android already decode HEIC via system codecs inside ImageManipulator,
// so this only needs to run on web.
export async function normalizeToJpegUri(uri: string, mimeType?: string): Promise<string> {
  if (Platform.OS !== 'web') return uri;

  const looksHeic = mimeType === 'image/heic' || mimeType === 'image/heif' || HEIC_EXTENSION.test(uri);
  if (!looksHeic) return uri;

  try {
    const heic2any = (await import('heic2any')).default;
    const sourceBlob = await fetch(uri).then(r => r.blob());
    const converted = await heic2any({ blob: sourceBlob, toType: 'image/jpeg', quality: 0.9 });
    const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
    return URL.createObjectURL(jpegBlob);
  } catch (e: any) {
    throw new Error(`Could not convert HEIC photo: ${e.message ?? e}`);
  }
}
