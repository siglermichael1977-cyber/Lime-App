import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

const LINKS = [
  { name: 'Republic Bank (Trinidad & Tobago)', url: 'https://www.republictt.com', description: 'One of the largest banking groups in the Caribbean.' },
  { name: 'NCB Jamaica', url: 'https://www.jncb.com', description: 'National Commercial Bank — one of Jamaica’s largest banks.' },
  { name: 'Scotiabank Caribbean', url: 'https://caribbean.scotiabank.com', description: 'Regional Caribbean banking from Scotiabank.' },
  { name: 'Remitly', url: 'https://www.remitly.com', description: 'Send money home fast, with tracking and rate transparency.' },
  { name: 'WorldRemit', url: 'https://www.worldremit.com', description: 'International money transfers to bank accounts, cash pickup, and mobile money.' },
];

export default function BanksTab() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.sub}>Banking and money-transfer services across the Caribbean and diaspora.</Text>
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
  sub: { fontSize: 12.5, color: colors.muted, marginBottom: 10, lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 16, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 14, color: colors.seaDeep },
  desc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  arrow: { fontSize: 18, color: colors.sea, marginLeft: 8 },
});
