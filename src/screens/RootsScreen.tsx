import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { FamilyMember } from '../lib/types';
import { openExternal } from '../lib/openExternal';
import ScreenBackdrop from '../components/ScreenBackdrop';

const DNA_SERVICES = [
  { name: 'AncestryDNA', url: 'https://www.ancestry.com', description: 'The largest consumer DNA and family tree database.' },
  { name: '23andMe', url: 'https://www.23andme.com', description: 'DNA testing with ancestry composition and health insights.' },
  { name: 'MyHeritage', url: 'https://www.myheritage.com', description: 'DNA testing plus billions of historical records worldwide.' },
  { name: 'African Ancestry', url: 'https://africanancestry.com', description: 'Traces maternal and paternal lineage to specific African countries and ethnic groups.' },
  { name: 'FamilySearch', url: 'https://www.familysearch.org', description: 'Free, nonprofit genealogy records and family tree building.' },
];

export default function RootsScreen() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [myId, setMyId] = useState('');
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [place, setPlace] = useState('');

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);
    const { data } = await supabase.from('family_members')
      .select('*').eq('owner_id', user.id).order('created_at');
    setMembers(data ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = async () => {
    if (!name.trim()) { Alert.alert('Give them a name 🙂'); return; }
    const { error } = await supabase.from('family_members').insert({
      owner_id: myId, name: name.trim(), relation: relation.trim() || null, place: place.trim() || null,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setShow(false); setName(''); setRelation(''); setPlace('');
    load();
  };

  const remove = (m: FamilyMember) => {
    Alert.alert('Remove from tree?', m.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive',
        onPress: async () => { await supabase.from('family_members').delete().eq('id', m.id); load(); } },
    ]);
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <Text style={s.h}>Roots & Lineage 🌳</Text>
      <Text style={s.sub}>
        Your family tree is private to you. Record the elders' names, villages, and journeys before they're lost.
      </Text>
      <FlatList
        data={members}
        keyExtractor={m => m.id}
        ListHeaderComponent={
          <View style={s.dnaBox}>
            <Text style={s.dnaTitle}>Trace Your Roots 🧬</Text>
            <Text style={s.dnaSub}>Curious where your bloodline runs? These services help you dig deeper.</Text>
            {DNA_SERVICES.map(svc => (
              <TouchableOpacity key={svc.name} style={s.dnaRow} onPress={() => openExternal(svc.url)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.dnaName}>{svc.name}</Text>
                  <Text style={s.dnaDesc}>{svc.description}</Text>
                </View>
                <Text style={s.dnaArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onLongPress={() => remove(item)}>
            <View style={s.dot} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                {[item.relation, item.place].filter(Boolean).join(' · ') || 'Tap and hold to remove'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>
            Start with what you know — a grandparent's name and parish is enough to begin. 🌱
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity style={s.fab} onPress={() => setShow(true)}>
        <Text style={s.fabText}>+ Add relative</Text>
      </TouchableOpacity>

      <Modal visible={show} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Add a relative 🌳</Text>
            <TextInput style={s.input} placeholder="Name (e.g. Auntie Merle)"
              placeholderTextColor="#8FA6A1" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Relation (e.g. grandmother)"
              placeholderTextColor="#8FA6A1" value={relation} onChangeText={setRelation} />
            <TextInput style={s.input} placeholder="Island / parish / city"
              placeholderTextColor="#8FA6A1" value={place} onChangeText={setPlace} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.ghostBtn} onPress={() => setShow(false)}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={add}>
                <Text style={s.btnText}>Add to tree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 54 },
  h: { fontSize: 22, fontWeight: '800', color: colors.ink, paddingHorizontal: 18 },
  sub: { fontSize: 12.5, color: colors.muted, paddingHorizontal: 18, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.line, borderWidth: 1, borderRadius: 16, marginHorizontal: 14, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mango },
  name: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 40, lineHeight: 20 },
  dnaBox: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 18,
    marginHorizontal: 14, marginBottom: 16, padding: 15,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  dnaTitle: { fontWeight: '800', fontSize: 14.5, color: colors.ink },
  dnaSub: { fontSize: 11.5, color: colors.muted, marginTop: 3, marginBottom: 6, lineHeight: 16 },
  dnaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: colors.line },
  dnaName: { fontWeight: '700', fontSize: 13, color: colors.seaDeep },
  dnaDesc: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  dnaArrow: { fontSize: 16, color: colors.sea, marginLeft: 8 },
  fab: { position: 'absolute', bottom: Platform.OS === 'web' ? 90 : 20, alignSelf: 'center', backgroundColor: '#5C4025',
    borderRadius: 999, paddingVertical: 13, paddingHorizontal: 26, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(9,63,58,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22,
    paddingBottom: Platform.OS === 'web' ? 110 : 40 },
  sheetH: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: colors.ink },
  input: { backgroundColor: colors.foam, borderColor: colors.line, borderWidth: 1.5, borderRadius: 14,
    padding: 13, marginBottom: 10, fontSize: 14, color: colors.ink },
  btn: { flex: 1, backgroundColor: colors.sea, borderRadius: 999, padding: 14 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  ghostBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: 999, padding: 14 },
  ghostBtnText: { textAlign: 'center', fontWeight: '700', color: colors.muted },
});
