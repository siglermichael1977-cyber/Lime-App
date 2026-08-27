import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

// Resize to a max ~1600px on the longest side and re-compress to JPEG quality ~0.7.
// Call normalizeToJpegUri() from heicToJpeg.ts first if the source might be HEIC —
// this function assumes it's already a browser-decodable format.
export async function compressImage(uri: string): Promise<string> {
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
