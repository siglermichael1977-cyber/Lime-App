import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import TravelTab from './resources/TravelTab';
import BanksTab from './resources/BanksTab';
import NewsTab from './resources/NewsTab';
import ImmigrationTab from './resources/ImmigrationTab';
import HealthcareTab from './resources/HealthcareTab';
import LegalTab from './resources/LegalTab';

const TABS = [
  { key: 'travel', label: '✈️ Travel' },
  { key: 'banks', label: '🏦 Banks & Money' },
  { key: 'news', label: '📰 News' },
  { key: 'immigration', label: '🛂 Immigration' },
  { key: 'healthcare', label: '🏥 Healthcare' },
  { key: 'legal', label: '⚖️ Legal' },
];

export default function ResourcesScreen() {
  const [tab, setTab] = useState('travel');

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll} contentContainerStyle={s.pills}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.pill, tab === t.key && s.pillOn]} onPress={() => setTab(t.key)}>
            <Text style={[s.pillText, tab === t.key && s.pillTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'travel' && <TravelTab />}
        {tab === 'banks' && <BanksTab />}
        {tab === 'news' && <NewsTab />}
        {tab === 'immigration' && <ImmigrationTab />}
        {tab === 'healthcare' && <HealthcareTab />}
        {tab === 'legal' && <LegalTab />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 20 },
  pillsScroll: { flexGrow: 0, marginBottom: 12 },
  pills: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  pillTextOn: { color: '#fff' },
  scroll: { paddingHorizontal: 14, paddingBottom: 40 },
});
