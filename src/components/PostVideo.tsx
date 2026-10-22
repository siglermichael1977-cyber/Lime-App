import React from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// Native (iOS/Android) video for feed posts; web keeps using a plain <video> tag.
// The player only loads the stream and waits for a tap — nothing autoplays in the feed.
export default function PostVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = false; });
  return (
    <VideoView player={player} style={s.video} nativeControls contentFit="contain"
      fullscreenOptions={{ enable: true }} />
  );
}

const s = StyleSheet.create({
  video: { width: '100%', height: 320, borderRadius: 12, marginBottom: 10, backgroundColor: '#000', overflow: 'hidden' },
});
