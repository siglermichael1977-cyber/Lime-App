import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

type Outlet = { name: string; url: string };
type IslandSection = { title: string; data: Outlet[] };

const NEWS: IslandSection[] = [
  { title: 'Trinidad & Tobago', data: [
    { name: 'Trinidad Guardian', url: 'https://www.guardian.co.tt' },
    { name: 'Trinidad Express', url: 'https://trinidadexpress.com' },
  ] },
  { title: 'Jamaica', data: [
    { name: 'Jamaica Gleaner', url: 'https://jamaica-gleaner.com' },
    { name: 'Jamaica Observer', url: 'https://www.jamaicaobserver.com' },
  ] },
  { title: 'Barbados', data: [
    { name: 'Nation News', url: 'https://www.nationnews.com' },
  ] },
  { title: 'Guyana', data: [
    { name: 'Stabroek News', url: 'https://www.stabroeknews.com' },
  ] },
  { title: 'Bahamas', data: [
    { name: 'The Tribune', url: 'https://www.tribune242.com' },
  ] },
  { title: 'Haiti', data: [
    { name: 'Le Nouvelliste', url: 'https://lenouvelliste.com' },
  ] },
  { title: 'Dominican Republic', data: [
    { name: 'Listín Diario', url: 'https://listindiario.com' },
  ] },
];

export default function NewsTab() {
  return (
    <SectionList
      sections={NEWS}
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
  );
}

const s = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.seaDeep, marginTop: 12, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 16,
    marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 14, color: colors.seaDeep },
  arrow: { fontSize: 18, color: colors.sea },
});
