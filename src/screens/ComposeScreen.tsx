import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { notifyPostCreated } from '../lib/feedBus';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { normalizeToJpegUri } from '../lib/heicToJpeg';
import { compressImage } from '../lib/imageUpload';
import { fixElementWithColor } from '../lib/webFormFix';

const TAGS = ['food', 'music'];
const MAX_VIDEO_DURATION_SEC = 300;

function formatDuration(totalSec: number): string {
  const sec = Math.round(totalSec);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
const MAX_VIDEO_SIZE_MB = 500;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
// A fixed timeout stopped making sense once the cap went from 50MB to 500MB — a 60s
// timeout would spuriously kill any large upload on a normal connection well before
// it could finish. Scale with file size instead (~300KB/s assumed floor speed),
// floored so small clips still fail fast and capped so a genuinely stuck request
// doesn't hang the UI indefinitely.
const VIDEO_UPLOAD_MIN_TIMEOUT_MS = 60_000;
const VIDEO_UPLOAD_MAX_TIMEOUT_MS = 600_000;
const VIDEO_UPLOAD_ASSUMED_BYTES_PER_SEC = 300 * 1024;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

// iPhones default to HEVC/H.265 inside a .mov (QuickTime) container. Chrome, Firefox,
// and Edge can't decode HEVC at all, and labeling the upload's Content-Type as
// video/mp4 when the bytes are actually QuickTime can make some browsers fail to
// parse the file entirely (nothing renders, not even a broken-video icon). We can't
// transcode client-side in this stack (ffmpeg.wasm's worker relies on a Vite-only
// dynamic import Metro refuses to bundle), so instead: preserve the real mimeType/
// extension end to end, and warn the poster up front since their own iPhone will
// happily play the file back even when nobody else's browser can.
const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
};

function videoExtensionFor(mimeType: string | null): string {
  return (mimeType && VIDEO_EXTENSION_BY_MIME[mimeType]) || 'mp4';
}

const HEVC_LIKELY_MIME_TYPES = ['video/quicktime', 'video/x-m4v'];

export default function ComposeScreen() {
  const nav = useNavigation<any>();
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'photo' | 'video' | 'posting'>('idle');
  const submittingRef = useRef(false);
  const bodyInputRef = useRef<any>(null);

  // Applied three ways so nothing Safari does before/around the first keystroke
  // can win: (1) as a static style below, present in the very first paint,
  // (2) here on mount, before the user has touched the field at all, and
  // (3) via onFocus/onChangeText on every interaction after that.
  useEffect(() => {
    if (Platform.OS === 'web') fixElementWithColor(bodyInputRef.current, colors.ink);
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    });
    if (res.canceled) return;
    try {
      const normalized = await normalizeToJpegUri(res.assets[0].uri, res.assets[0].mimeType);
      setImageUri(normalized);
    } catch (e: any) {
      console.error('Failed to process photo:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: MAX_VIDEO_DURATION_SEC,
      // iOS-only: re-encodes the picked video at a lower bitrate before we ever touch it.
      // No equivalent exists in expo-image-picker for Android or web.
      videoExportPreset: Platform.OS === 'ios' ? ImagePicker.VideoExportPreset.MediumQuality : undefined,
    });
    if (res.canceled) return;
    const asset = res.assets[0];

    // videoMaxDuration only caps camera *recording* — it does nothing when picking an
    // existing video from the library (and nothing at all on web), so enforce it here too.
    const durationSec = asset.duration != null ? asset.duration / 1000 : null;
    if (durationSec != null && durationSec > MAX_VIDEO_DURATION_SEC + 1) {
      Alert.alert('Video too long', `Videos can be up to ${formatDuration(MAX_VIDEO_DURATION_SEC)}. This one is ${formatDuration(durationSec)} — trim it and try again.`);
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
      Alert.alert('Video too large', `Videos must be under ${MAX_VIDEO_SIZE_MB}MB. Try a shorter or lower-resolution clip.`);
      return;
    }
    setVideoUri(asset.uri);
    setVideoMimeType(asset.mimeType ?? null);
    if (asset.mimeType && HEVC_LIKELY_MIME_TYPES.includes(asset.mimeType)) {
      Alert.alert(
        'Heads up about this video',
        "This looks like it's in iPhone's HEVC format, which won't play in Chrome, Firefox, or Edge — only Safari. " +
        'For a video everyone can watch, switch to Settings → Camera → Formats → "Most Compatible" before recording, then try again.'
      );
    }
  };

  const submit = async () => {
    if (submittingRef.current) return;
    if (!body.trim()) { Alert.alert('Write something first 🙂'); return; }
    submittingRef.current = true;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (!profile) throw new Error('You need an account to post.');

      let image_url: string | null = null;
      if (imageUri) {
        setUploadStage('photo');
        let uploadUri = imageUri;
        try {
          uploadUri = await compressImage(imageUri);
        } catch (e: any) {
          console.error('Image compression failed, uploading original:', e);
        }
        const fileName = `${user!.id}/${Date.now()}.jpg`;
        const file = await fetch(uploadUri).then(r => r.arrayBuffer());
        const { error: upErr } = await supabase.storage.from('post-images')
          .upload(fileName, file, { contentType: 'image/jpeg' });
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
        image_url = supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
      }

      let video_url: string | null = null;
      if (videoUri) {
        setUploadStage('video');
        const file = await fetch(videoUri).then(r => r.arrayBuffer());
        if (file.byteLength > MAX_VIDEO_SIZE_BYTES) {
          throw new Error(`That video is ${(file.byteLength / 1024 / 1024).toFixed(0)}MB — videos must be under ${MAX_VIDEO_SIZE_MB}MB. Try a shorter or lower-resolution clip.`);
        }
        // Preserve the real format instead of forcing .mp4/video-mp4 — an iPhone .mov
        // served with a mismatched Content-Type can fail to render at all in some browsers.
        const contentType = videoMimeType || 'video/mp4';
        const fileName = `${user!.id}/${Date.now()}.${videoExtensionFor(videoMimeType)}`;
        const uploadTimeoutMs = Math.min(
          VIDEO_UPLOAD_MAX_TIMEOUT_MS,
          Math.max(VIDEO_UPLOAD_MIN_TIMEOUT_MS, (file.byteLength / VIDEO_UPLOAD_ASSUMED_BYTES_PER_SEC) * 1000)
        );
        const { error: upErr } = await withTimeout(
          supabase.storage.from('post-videos').upload(fileName, file, { contentType }),
          uploadTimeoutMs,
          'Video upload timed out — check your connection and try again, or use a shorter clip.'
        );
        if (upErr) {
          const tooBig = /exceeded the maximum allowed size|payload too large|maximum size/i.test(upErr.message);
          throw new Error(tooBig
            ? `That video is too large for the server (limit ~${MAX_VIDEO_SIZE_MB}MB). Try a shorter or lower-resolution clip.`
            : `Video upload failed: ${upErr.message}`);
        }
        video_url = supabase.storage.from('post-videos').getPublicUrl(fileName).data.publicUrl;
      }

      setUploadStage('posting');
      const { error } = await supabase.from('posts').insert({
        author_id: user!.id,
        body: body.trim(),
        image_url,
        video_url,
        island: profile.island,
        posted_from: profile.current_location,
        tags,
      });
      if (error) throw error;
      notifyPostCreated();
      nav.goBack();
    } catch (e: any) {
      console.error('Failed to create post:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      submittingRef.current = false;
      setBusy(false);
      setUploadStage('idle');
    }
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <TextInput ref={bodyInputRef} style={s.input} multiline placeholder="Wah gwaan? Share wid de yard…"
        placeholderTextColor="#8FA6A1" value={body} maxLength={2000} autoFocus
        onFocus={() => fixElementWithColor(bodyInputRef.current, colors.ink)}
        onChangeText={(t) => { setBody(t); fixElementWithColor(bodyInputRef.current, colors.ink); }} />
      {imageUri && <Image source={{ uri: imageUri }} style={s.preview} />}
      {videoUri && Platform.OS === 'web' &&
        React.createElement('video', {
          src: videoUri, controls: true, playsInline: true, preload: 'metadata',
          style: { width: '100%', maxHeight: 220, borderRadius: 14, marginTop: 12, backgroundColor: '#000' },
        })}
      <View style={s.row}>
        <TouchableOpacity style={s.ghost} onPress={pickImage}>
          <Text style={s.ghostText}>📷 {imageUri ? 'Change photo' : 'Add photo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghost} onPress={pickVideo}>
          <Text style={s.ghostText}>🎥 {videoUri ? 'Change video' : 'Add video'}</Text>
        </TouchableOpacity>
        {TAGS.map(t => (
          <TouchableOpacity key={t}
            style={[s.ghost, tags.includes(t) && s.ghostOn]}
            onPress={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}>
            <Text style={[s.ghostText, tags.includes(t) && { color: colors.seaDeep }]}>#{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        <View style={s.btnRow}>
          {busy && <ActivityIndicator color="#fff" size="small" />}
          <Text style={s.btnText}>
            {uploadStage === 'video' ? 'Uploading video…'
              : uploadStage === 'photo' ? 'Uploading photo…'
              : busy ? 'Posting…' : 'Post it 🔥'}
          </Text>
        </View>
      </TouchableOpacity>
      {uploadStage === 'video' && (
        <Text style={s.uploadHint}>
          Larger or longer videos can take a few minutes — this hasn't frozen, keep this tab open.
        </Text>
      )}
      <Text style={s.note}>
        Tip: after posting, use "Pass it on" to share straight to WhatsApp, Instagram, or anywhere.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', padding: 18, paddingBottom: Platform.OS === 'web' ? 110 : 18 },
  input: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1.5, borderRadius: 16,
    padding: 14, minHeight: 130, fontSize: 15, textAlignVertical: 'top', color: colors.ink,
    shadowColor: colors.seaDeep, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1,
    // Static, present on the very first paint — belt-and-suspenders alongside the
    // mount effect and onFocus/onChangeText handlers below. react-native-web passes
    // unrecognized style keys straight through as CSS, so this becomes a real
    // -webkit-text-fill-color / opacity declaration on the underlying <textarea>.
    ...(Platform.OS === 'web' ? { WebkitTextFillColor: '#12292E', opacity: 1 } as any : null) },
  preview: { width: '100%', height: 200, borderRadius: 14, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  ghost: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 14 },
  ghostOn: { backgroundColor: colors.sky, borderColor: colors.sea },
  ghostText: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  btn: { backgroundColor: colors.sea, borderRadius: 999, padding: 15, marginTop: 18 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 15 },
  note: { fontSize: 11.5, color: colors.muted, marginTop: 12, textAlign: 'center', lineHeight: 17 },
  uploadHint: { fontSize: 12, color: colors.sea, fontWeight: '600', marginTop: 10, textAlign: 'center', lineHeight: 16 },
});
