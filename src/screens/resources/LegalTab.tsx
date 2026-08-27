import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

type Resource = { name: string; url: string };
type Section = { title: string; data: Resource[] };

const searchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

const LEGAL: Section[] = [
  { title: 'US Immigration Attorneys', data: [
    { name: 'American Immigration Lawyers Association (AILA)', url: 'https://www.aila.org' },
  ] },
  { title: 'Jamaica', data: [
    { name: 'Jamaican Bar Association', url: searchUrl('Jamaican Bar Association') },
  ] },
  { title: 'Trinidad & Tobago', data: [
    { name: 'Law Association of Trinidad and Tobago', url: searchUrl('Law Association of Trinidad and Tobago') },
  ] },
  { title: 'Barbados', data: [
    { name: 'Barbados Bar Association', url: searchUrl('Barbados Bar Association') },
  ] },
  { title: 'Guyana', data: [
    { name: 'Guyana Bar Association', url: searchUrl('Guyana Bar Association') },
  ] },
];

export default function LegalTab() {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.note}>
        <Text style={s.noteText}>⚠️ LIME does not endorse or vouch for any listed attorney or organization; this is not legal advice.</Text>
      </View>
      <SectionList
        sections={LEGAL}
        keyExtractor={(item, i) => item.name + i}
        renderSectionHeader={({ section }) => <Text style={s.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openExternal(item.url)}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.arrow}>↗</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        stickySectionHeadersEnabled={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  note: { backgroundColor: 'rgba(255,177,61,0.18)', borderColor: colors.mango, borderWidth: 1, borderRadius: 14,
    padding: 12, marginBottom: 8 },
  noteText: { fontSize: 12, color: colors.ink, lineHeight: 17, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.seaDeep, marginTop: 12, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 16,
    marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 13.5, color: colors.seaDeep, flex: 1, marginRight: 8 },
  arrow: { fontSize: 18, color: colors.sea },
});
