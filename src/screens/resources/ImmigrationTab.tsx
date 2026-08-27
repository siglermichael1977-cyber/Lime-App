import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

const LINKS = [
  { name: 'USCIS (US Citizenship & Immigration Services)', url: 'https://www.uscis.gov', description: 'Official US immigration agency.' },
  { name: 'USCIS Case Status', url: 'https://egov.uscis.gov/casestatus/landing.do', description: 'Check the status of a pending US immigration case.' },
  { name: 'UK Visas & Immigration (gov.uk)', url: 'https://www.gov.uk/browse/visas-immigration', description: 'Official UK government visa and immigration information.' },
  { name: 'Canada IRCC', url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html', description: 'Official Immigration, Refugees and Citizenship Canada portal.' },
  { name: 'CARICOM Free Movement', url: 'https://caricom.org', description: 'Official CARICOM site — regional free movement and travel policy.' },
  { name: 'Jamaica PICA', url: 'https://www.pica.gov.jm', description: 'Passport, Immigration and Citizenship Agency of Jamaica.' },
  { name: 'Trinidad & Tobago Immigration Division', url: 'https://www.immigration.gov.tt', description: 'Official immigration authority for Trinidad & Tobago.' },
];

export default function ImmigrationTab() {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.note}>
        <Text style={s.noteText}>⚠️ Official links only — not legal advice. Consult a licensed immigration attorney for your case.</Text>
      </View>
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
  note: { backgroundColor: 'rgba(255,177,61,0.18)', borderColor: colors.mango, borderWidth: 1, borderRadius: 14,
    padding: 12, marginBottom: 12 },
  noteText: { fontSize: 12, color: colors.ink, lineHeight: 17, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 16, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontWeight: '700', fontSize: 14, color: colors.seaDeep },
  desc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  arrow: { fontSize: 18, color: colors.sea, marginLeft: 8 },
});
