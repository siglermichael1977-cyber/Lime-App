import React, { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { requireAccount } from '../lib/guest';
import { colors } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';

type Dish = { name: string; description: string };
type IslandSection = { title: string; data: Dish[] };

// TODO: restaurant_submissions insert keeps failing RLS in production despite a verified-correct
// policy (auth.uid() = submitted_by) — cause not yet found. Hidden until that's root-caused.
const SUBMISSIONS_ENABLED = true;

const DISHES: IslandSection[] = [
  { title: 'Jamaica', data: [
    { name: 'Jerk Chicken', description: 'Chicken marinated in scotch bonnet, allspice, and thyme, slow-grilled over pimento wood.' },
    { name: 'Ackee & Saltfish', description: 'The national dish — ackee fruit sautéed with salted cod, peppers, and onion.' },
    { name: 'Curry Goat', description: 'Tender goat stewed in warm curry spices, often served with rice and peas.' },
  ] },
  { title: 'Trinidad & Tobago', data: [
    { name: 'Doubles', description: 'Fried bara bread filled with curried channa (chickpeas) — classic street food.' },
    { name: 'Roti', description: 'Soft flatbread wrapped around curried meat, potato, or vegetables.' },
    { name: 'Callaloo', description: 'A creamy dasheen-leaf stew, often made with okra and crab.' },
  ] },
  { title: 'Barbados', data: [
    { name: 'Cou-Cou & Flying Fish', description: 'The national dish — cornmeal cou-cou served with steamed flying fish in gravy.' },
    { name: 'Macaroni Pie', description: 'A baked, cheesy Bajan take on mac and cheese, a Sunday-lunch staple.' },
  ] },
  { title: 'Haiti', data: [
    { name: 'Griot', description: 'Crispy fried pork shoulder marinated in citrus and herbs.' },
    { name: 'Diri ak Djon Djon', description: 'Black rice cooked with prized Haitian mushrooms.' },
  ] },
  { title: 'Dominican Republic', data: [
    { name: 'Mangú', description: 'Mashed plantains, often served with fried cheese, eggs, and salami ("los tres golpes").' },
    { name: 'Sancocho', description: 'A hearty multi-meat stew with root vegetables, saved for special occasions.' },
  ] },
  { title: 'Puerto Rico', data: [
    { name: 'Mofongo', description: 'Fried mashed plantains packed with garlic, often stuffed with meat or seafood.' },
    { name: 'Arroz con Gandules', description: 'Rice cooked with pigeon peas and sofrito — a staple at every celebration.' },
  ] },
  { title: 'Guyana', data: [
    { name: 'Pepperpot', description: 'A rich, dark cassareep-based meat stew, traditionally eaten at Christmas.' },
    { name: 'Cook-up Rice', description: 'One-pot rice cooked with beans, coconut milk, and meat.' },
  ] },
];

export default function EatsScreen() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !url.trim()) { Alert.alert('Almost there', 'Add at least a name and a link.'); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('You must be logged in to submit a restaurant.');
      }
      const { error } = await supabase.from('restaurant_submissions').insert({
        submitted_by: user.id,
        name: name.trim(),
        url: url.trim(),
        note: note.trim() || null,
      });
      if (error) throw error;
      Alert.alert('Thanks!', 'We got your restaurant suggestion.');
      setShow(false); setName(''); setUrl(''); setNote('');
    } catch (e: any) {
      console.error('Failed to submit restaurant:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <SectionList
        sections={DISHES}
        keyExtractor={(item, i) => item.name + i}
        renderSectionHeader={({ section }) => <Text style={s.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.dishName}>{item.name}</Text>
            <Text style={s.dishDesc}>{item.description}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.sub}>Dishes from across the Caribbean.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 90 }}
        stickySectionHeadersEnabled={false}
      />
      {SUBMISSIONS_ENABLED && (
        <>
          <TouchableOpacity style={s.fab} onPress={async () => {
            if (await requireAccount('submit a restaurant')) return;
            setShow(true);
          }}>
            <Text style={s.fabText}>+ Submit a restaurant</Text>
          </TouchableOpacity>

          <Modal visible={show} animationType="slide" transparent>
            <View style={s.sheetWrap}>
              <View style={s.sheet}>
                <Text style={s.sheetH}>Submit a restaurant or menu 🍽️</Text>
                <TextInput style={s.input} placeholder="Restaurant name" placeholderTextColor="#8FA6A1"
                  value={name} onChangeText={setName} />
                <TextInput style={s.input} placeholder="Link (website, Instagram, menu URL)" placeholderTextColor="#8FA6A1"
                  autoCapitalize="none" value={url} onChangeText={setUrl} />
                <TextInput style={s.input} placeholder="Note (optional)" placeholderTextColor="#8FA6A1"
                  value={note} onChangeText={setNote} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={s.ghostBtn} onPress={() => setShow(false)}>
                    <Text style={s.ghostBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
                    <Text style={s.btnText}>{busy ? '…' : 'Submit'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingTop: 20, paddingHorizontal: 18, marginBottom: 4 },
  sub: { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.seaDeep, backgroundColor: 'transparent',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 16,
    marginHorizontal: 14, marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  dishName: { fontWeight: '700', fontSize: 14, color: colors.ink },
  dishDesc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  fab: { position: 'absolute', bottom: Platform.OS === 'web' ? 90 : 20, alignSelf: 'center', backgroundColor: colors.hibiscus,
    borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 13 },
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
