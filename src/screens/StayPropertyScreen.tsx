import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import PropertyScreen from './PropertyScreen';
import StayTab from './stay/StayTab';

const TABS = [
  { key: 'buyrent', label: '🏡 Buy/Rent' },
  { key: 'stay', label: '🛏️ Stay' },
];

export default function StayPropertyScreen() {
  const [tab, setTab] = useState('buyrent');

  return (
    <View style={s.wrap}>
      {tab === 'stay' && <ScreenBackdrop />}
      <View style={s.pills}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.pill, tab === t.key && s.pillOn]} onPress={() => setTab(t.key)}>
            <Text style={[s.pillText, tab === t.key && s.pillTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1, paddingHorizontal: tab === 'stay' ? 14 : 0 }}>
        {tab === 'buyrent' && <PropertyScreen />}
        {tab === 'stay' && <StayTab />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 20 },
  pills: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  pillTextOn: { color: '#fff' },
});
