import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import MusicTab from './culture/MusicTab';
import PoemsTab from './culture/PoemsTab';
import StoriesTab from './culture/StoriesTab';
import BooksTab from './culture/BooksTab';
import ArtistsTab from './culture/ArtistsTab';
import ShowsTab from './culture/ShowsTab';

const TABS = [
  { key: 'music', label: '🎵 Music' },
  { key: 'artists', label: '🎤 Artists' },
  { key: 'poems', label: '📜 Poems' },
  { key: 'stories', label: '📖 Stories' },
  { key: 'books', label: '📚 Books' },
  { key: 'shows', label: '🎬 Shows' },
];

export default function CultureScreen() {
  const [tab, setTab] = useState('music');

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      {tab !== 'artists' && tab !== 'shows' && (
        <Text style={s.note}>
          🌴 Share your own original work, or links to it — please don't upload copyrighted songs, books, or someone else's writing.
        </Text>
      )}
      <View style={s.pills}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.pill, tab === t.key && s.pillOn]} onPress={() => setTab(t.key)}>
            <Text style={[s.pillText, tab === t.key && s.pillTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1, paddingHorizontal: tab === 'books' ? 14 : 0 }}>
        {tab === 'music' && <MusicTab />}
        {tab === 'artists' && <ArtistsTab />}
        {tab === 'poems' && <PoemsTab />}
        {tab === 'stories' && <StoriesTab />}
        {tab === 'books' && <BooksTab />}
        {tab === 'shows' && <ShowsTab />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 20 },
  note: { fontSize: 12, color: colors.muted, paddingHorizontal: 18, marginBottom: 10, lineHeight: 17 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 12 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 14 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  pillTextOn: { color: '#fff' },
});
