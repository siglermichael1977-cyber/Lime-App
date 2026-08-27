import React from 'react';
import { View, Platform } from 'react-native';
import { colors } from '../theme';

// A subtle, static (no animation) daytime version of the login screen's Caribbean
// backdrop — light enough to sit behind dense scrolling content without hurting
// readability or scroll performance.
export default function ScreenBackdrop() {
  if (Platform.OS !== 'web') {
    return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.foam }} />;
  }

  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #EAF5F0 0%, #F2F7F4 45%, #FBF3E4 100%)',
        pointerEvents: 'none',
      },
    },
    React.createElement(
      'svg',
      {
        viewBox: '0 0 800 1000',
        preserveAspectRatio: 'xMidYMax slice',
        style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 },
      },
      React.createElement('path', {
        d: 'M0,880 C100,840 200,920 300,880 C400,840 500,920 600,880 C700,840 800,920 800,880 L800,1000 L0,1000 Z',
        fill: colors.sea,
      }),
      React.createElement(
        'g',
        { transform: 'translate(660,820) scale(0.85)' },
        React.createElement('path', {
          d: 'M0,0 C-6,-60 8,-140 0,-230',
          stroke: colors.seaDeep,
          strokeWidth: 14,
          strokeLinecap: 'round',
          fill: 'none',
        }),
        ...[-100, -60, -25, 10, 45, 80, 120].map((angle, i) =>
          React.createElement('path', {
            key: i,
            d: 'M0,0 Q70,-25 140,0 Q70,10 0,0 Z',
            fill: colors.seaDeep,
            transform: `translate(0,-230) rotate(${angle})`,
          }),
        ),
      ),
    ),
  );
}
