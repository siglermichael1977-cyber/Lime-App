import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { colors } from '../theme';

const STYLE_ID = 'lime-caribbean-backdrop-styles';

function injectStylesOnce() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes lime-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    @keyframes lime-wave-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes lime-glow-pulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.1); } }
    .lime-palm-sway { animation: lime-sway 7s ease-in-out infinite; transform-origin: 0px 0px; }
    .lime-wave-back { animation: lime-wave-drift 26s linear infinite; }
    .lime-wave-front { animation: lime-wave-drift 18s linear infinite; }
    .lime-sun-glow { animation: lime-glow-pulse 6s ease-in-out infinite; transform-origin: 400px 250px; }
    @media (prefers-reduced-motion: reduce) {
      .lime-palm-sway, .lime-wave-back, .lime-wave-front, .lime-sun-glow { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

// Two copies of the same hump path side by side (each 800 units wide) so the
// containing <g> can loop translateX 0 -> -50% seamlessly forever.
function WaveLayer({ className, y, opacity }: { className: string; y: number; opacity: number }) {
  const hump = `M0,${y} C100,${y - 45} 200,${y + 45} 300,${y} C400,${y - 45} 500,${y + 45} 600,${y} C700,${y - 45} 800,${y + 45} 800,${y} L800,1000 L0,1000 Z`;
  return React.createElement(
    'g',
    { className },
    React.createElement('path', { d: hump, fill: '#FFFFFF', opacity }),
    React.createElement('path', { d: hump, fill: '#FFFFFF', opacity, transform: 'translate(800,0)' }),
  );
}

function PalmTree() {
  const fronds = [-100, -60, -25, 10, 45, 80, 120];
  return React.createElement(
    'g',
    { transform: 'translate(560,760) scale(1.15)' },
    React.createElement(
      'g',
      { className: 'lime-palm-sway' },
      // trunk
      React.createElement('path', {
        d: 'M0,0 C-6,-60 8,-140 0,-230',
        stroke: '#0B2A26',
        strokeWidth: 14,
        strokeLinecap: 'round',
        fill: 'none',
      }),
      // fronds
      ...fronds.map((angle, i) =>
        React.createElement('path', {
          key: i,
          d: 'M0,0 Q70,-25 140,0 Q70,10 0,0 Z',
          fill: '#0B2A26',
          transform: `translate(0,-230) rotate(${angle})`,
        }),
      ),
    ),
  );
}

function BackdropSVG() {
  return React.createElement(
    'svg',
    {
      viewBox: '0 0 800 1000',
      preserveAspectRatio: 'xMidYMax slice',
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
    },
    React.createElement(
      'defs',
      null,
      React.createElement(
        'radialGradient',
        { id: 'limeSunGlow', cx: '50%', cy: '50%', r: '50%' },
        React.createElement('stop', { offset: '0%', stopColor: '#FFE1A8', stopOpacity: 0.95 }),
        React.createElement('stop', { offset: '45%', stopColor: '#FFB13D', stopOpacity: 0.55 }),
        React.createElement('stop', { offset: '100%', stopColor: '#E8465C', stopOpacity: 0 }),
      ),
    ),
    React.createElement('circle', {
      className: 'lime-sun-glow',
      cx: 400,
      cy: 250,
      r: 190,
      fill: 'url(#limeSunGlow)',
    }),
    React.createElement(WaveLayer, { className: 'lime-wave-back', y: 830, opacity: 0.22 }),
    React.createElement(WaveLayer, { className: 'lime-wave-front', y: 880, opacity: 0.32 }),
    React.createElement(PalmTree, null),
  );
}

export default function CaribbeanBackdrop() {
  useEffect(() => {
    if (Platform.OS === 'web') injectStylesOnce();
  }, []);

  if (Platform.OS !== 'web') {
    return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.seaDeep }} />;
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
        background: 'linear-gradient(180deg, #071F1D 0%, #0E5E57 30%, #1C8577 52%, #E8A33D 80%, #FBCB78 100%)',
        pointerEvents: 'none',
      },
    },
    React.createElement(BackdropSVG, null),
  );
}
