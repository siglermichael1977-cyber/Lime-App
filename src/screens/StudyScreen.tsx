import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { openExternal } from '../lib/openExternal';
import ScreenBackdrop from '../components/ScreenBackdrop';

type Portal = { name: string; url: string; description: string };
type RegionSection = { title: string; data: Portal[] };

const PORTALS: RegionSection[] = [
  { title: 'Caribbean', data: [
    { name: 'University of the West Indies (UWI)', url: 'https://www.uwi.edu', description: 'The Caribbean’s largest regional university, with campuses across multiple islands.' },
  ] },
  { title: 'US', data: [
    { name: 'Common App', url: 'https://www.commonapp.org', description: 'Apply to 1,000+ US colleges with one application.' },
  ] },
  { title: 'UK', data: [
    { name: 'UCAS', url: 'https://www.ucas.com', description: 'The official UK university and college application service.' },
  ] },
  { title: 'Canada', data: [
    { name: 'EduCanada', url: 'https://www.educanada.ca', description: 'Government of Canada’s official study-in-Canada portal.' },
  ] },
  { title: 'Other', data: [
    { name: 'Fulbright Program', url: 'https://www.fulbrightonline.org', description: 'International exchange and scholarship program for study abroad.' },
  ] },
];

export default function StudyScreen() {
  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <SectionList
        sections={PORTALS}
        keyExtractor={(item, i) => item.name + i}
        renderSectionHeader={({ section }) => <Text style={s.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openExternal(item.url)}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.desc}>{item.description}</Text>
            </View>
            <Text style={s.arrow}>↗</Text>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.sub}>College and scholarship application portals, grouped by region.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingTop: 20, paddingHorizontal: 18, marginBottom: 4 },
  sub: { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.seaDeep, backgroundColor: 'transparent',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 16, marginHorizontal: 14, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 14, color: colors.seaDeep },
  desc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  arrow: { fontSize: 18, color: colors.sea, marginLeft: 8 },
});
