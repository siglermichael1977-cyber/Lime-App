import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

const FLIGHT_SEARCH = [
  { name: 'Skyscanner', url: 'https://www.skyscanner.com' },
  { name: 'Google Flights', url: 'https://www.google.com/travel/flights' },
];

const AIRLINES = [
  { name: 'Caribbean Airlines', url: 'https://www.caribbean-airlines.com' },
  { name: 'JetBlue', url: 'https://www.jetblue.com' },
  { name: 'American Airlines', url: 'https://www.aa.com' },
  { name: 'Spirit Airlines', url: 'https://www.spirit.com' },
];

const RESORTS = [
  { name: 'Sandals Resorts', url: 'https://www.sandals.com' },
  { name: 'Beaches Resorts', url: 'https://www.beaches.com' },
  { name: 'Couples Resorts', url: 'https://www.couples.com' },
];

export default function TravelTab() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.sectionTitle}>Compare flight prices</Text>
      {FLIGHT_SEARCH.map(link => (
        <TouchableOpacity key={link.name} style={s.card} onPress={() => openExternal(link.url)}>
          <Text style={s.name}>{link.name}</Text>
          <Text style={s.arrow}>↗</Text>
        </TouchableOpacity>
      ))}
      <Text style={s.sectionTitle}>Airlines</Text>
      {AIRLINES.map(link => (
        <TouchableOpacity key={link.name} style={s.card} onPress={() => openExternal(link.url)}>
          <Text style={s.name}>{link.name}</Text>
          <Text style={s.arrow}>↗</Text>
        </TouchableOpacity>
      ))}
      <Text style={s.sectionTitle}>Resorts</Text>
      {RESORTS.map(link => (
        <TouchableOpacity key={link.name} style={s.card} onPress={() => openExternal(link.url)}>
          <Text style={s.name}>{link.name}</Text>
          <Text style={s.arrow}>↗</Text>
        </TouchableOpacity>
      ))}
    </View>
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
