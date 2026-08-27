import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

type Facility = { name: string };
type IslandSection = { title: string; data: Facility[] };

const FACILITIES: IslandSection[] = [
  { title: 'Jamaica', data: [
    { name: 'University Hospital of the West Indies (UHWI)' },
    { name: 'Kingston Public Hospital' },
  ] },
  { title: 'Trinidad & Tobago', data: [
    { name: 'Port of Spain General Hospital' },
    { name: 'Eric Williams Medical Sciences Complex' },
  ] },
  { title: 'Barbados', data: [
    { name: 'Queen Elizabeth Hospital' },
  ] },
  { title: 'Guyana', data: [
    { name: 'Georgetown Public Hospital Corporation' },
  ] },
  { title: 'Bahamas', data: [
    { name: 'Princess Margaret Hospital' },
  ] },
  { title: 'Haiti', data: [
    { name: "Hôpital de l'Université d'État d'Haïti (HUEH)" },
  ] },
];

const searchUrl = (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name + ' contact')}`;

export default function HealthcareTab() {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.note}>
        <Text style={s.noteText}>⚠️ Directory only, not medical advice. Tap a facility to search for its current contact info and hours.</Text>
      </View>
      <SectionList
        sections={FACILITIES}
        keyExtractor={(item, i) => item.name + i}
        renderSectionHeader={({ section }) => <Text style={s.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openExternal(searchUrl(item.name))}>
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
