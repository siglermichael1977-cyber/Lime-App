import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';

const ITEMS = [
  { key: 'Wuk', icon: '💼', title: 'Wuk & Hustle', desc: 'Jobs, hustles, and more job sites to browse.' },
  { key: 'Roots', icon: '🌳', title: 'Roots DNA & Genealogy', desc: 'Your family tree, plus DNA services to trace it further.' },
  { key: 'Eats', icon: '🍽️', title: 'Eats', desc: 'Caribbean dishes by island.' },
  { key: 'Study', icon: '🎓', title: 'Study', desc: 'College and scholarship portals around the world.' },
  { key: 'Culture', icon: '🎭', title: 'Culture', desc: 'Music, poems, stories, and Caribbean literature.' },
  { key: 'StayProperty', icon: '🏡', title: 'Stay & Property', desc: 'Land and houses to buy or rent, plus places to stay.' },
  { key: 'Resources', icon: '📋', title: 'Resources', desc: 'Travel, banks, news, immigration, healthcare, and legal directories.' },
];

export default function MoreScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <Text style={s.h}>More 🧭</Text>
      {ITEMS.map(item => (
        <TouchableOpacity key={item.key} style={s.row} onPress={() => nav.navigate(item.key)}>
          <Text style={s.icon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.desc}>{item.desc}</Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 54, paddingHorizontal: 18 },
  h: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, gap: 12,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  icon: { fontSize: 26 },
  title: { fontWeight: '700', fontSize: 15, color: colors.ink },
  desc: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },
  arrow: { fontSize: 20, color: colors.muted },
});
