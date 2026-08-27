import React from 'react';
import { Image, View, Text, ImageStyle, ViewStyle } from 'react-native';

export default function Avatar({ uri, letter, size, bgColor, borderWidth = 0, borderColor }: {
  uri?: string | null;
  letter: string;
  size: number;
  bgColor: string;
  borderWidth?: number;
  borderColor?: string;
}) {
  const shared = { width: size, height: size, borderRadius: size / 2, borderWidth, borderColor };

  if (uri) {
    return <Image source={{ uri }} style={shared as ImageStyle} />;
  }
  return (
    <View style={[shared as ViewStyle, { backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{letter}</Text>
    </View>
  );
}
