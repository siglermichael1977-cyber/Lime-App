import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

const LINKS = [
  { name: 'Airbnb', url: 'https://www.airbnb.com', description: 'Homes, apartments, and unique stays across the Caribbean.' },
  { name: 'Booking.com', url: 'https://www.booking.com', description: 'Hotels, resorts, and guesthouses with free cancellation options.' },
  { name: 'Expedia', url: 'https://www.expedia.com', description: 'Hotels, packages, and travel deals.' },
  { name: 'Search Caribbean guesthouses', url: 'https://www.google.com/search?q=Caribbean+guesthouses', description: 'General web search for locally-run guesthouses by island.' },
];

export default function StayTab() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.sub}>Find a place to stay. These are outbound links only — booking happens on each site.</Text>
      {LINKS.map(link => (
        <TouchableOpacity key={link.name} style={s.card} onPress={() => openExternal(link.url)}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{link.name}</Text>
            <Text style={s.desc}>{link.description}</Text>
          </View>
          <Text style={s.arrow}>↗</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  sub: { fontSize: 12.5, color: colors.muted, paddingHorizontal: 4, marginBottom: 10, lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 16, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 14, color: colors.seaDeep },
  desc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  arrow: { fontSize: 18, color: colors.sea, marginLeft: 8 },
});
