import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { requireAccount } from '../lib/guest';
import { colors } from '../theme';
import { EventRow } from '../lib/types';
import ScreenBackdrop from '../components/ScreenBackdrop';

export default function EventsScreen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [myId, setMyId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [when, setWhen] = useState('');

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);
    const { data } = await supabase.from('events')
      .select('*, event_rsvps(user_id)')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at');
    setEvents(data ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleRsvp = async (ev: EventRow) => {
    if (await requireAccount('RSVP')) return;
    const going = ev.event_rsvps?.some(r => r.user_id === myId);
    if (going) await supabase.from('event_rsvps').delete().match({ event_id: ev.id, user_id: myId });
    else await supabase.from('event_rsvps').insert({ event_id: ev.id, user_id: myId });
    load();
  };

  const createEvent = async () => {
    if (!title || !city || !when) { Alert.alert('Fill in the lime, the city, and the date'); return; }
    const starts = new Date(when);
    if (isNaN(+starts)) { Alert.alert('Date format', 'Use YYYY-MM-DD (e.g. 2026-08-15)'); return; }
    const { error } = await supabase.from('events').insert({
      host_id: myId, title, city, starts_at: starts.toISOString(),
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setShowForm(false); setTitle(''); setCity(''); setWhen('');
    load();
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <Text style={s.h}>Linkups & Fetes 🎉</Text>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        renderItem={({ item }) => {
          const going = item.event_rsvps?.some(r => r.user_id === myId);
          const d = new Date(item.starts_at);
          return (
            <View style={s.card}>
              <View style={s.date}>
                <Text style={s.dateD}>{d.getDate()}</Text>
                <Text style={s.dateM}>{d.toLocaleString('en', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.meta}>{item.city} · {item.event_rsvps?.length ?? 0} cousins going</Text>
              </View>
              <TouchableOpacity style={[s.rsvp, going && s.rsvpOn]} onPress={() => toggleRsvp(item)}>
                <Text style={[s.rsvpText, going && { color: '#fff' }]}>
                  {going ? '✓ Reaching' : 'I reaching'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No linkups posted yet — host the first one. 🎉</Text>}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity style={s.fab} onPress={async () => {
        if (await requireAccount('host a linkup')) return;
        setShowForm(true);
      }}>
        <Text style={s.fabText}>+ Host a linkup</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Host a linkup 🎉</Text>
            <TextInput style={s.input} placeholder="What's the lime? (e.g. Beach cookout)"
              placeholderTextColor="#8FA6A1" value={title} onChangeText={setTitle} />
            <TextInput style={s.input} placeholder="City (e.g. Brooklyn, NY)"
              placeholderTextColor="#8FA6A1" value={city} onChangeText={setCity} />
            <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#8FA6A1" value={when} onChangeText={setWhen} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.ghostBtn} onPress={() => setShowForm(false)}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} onPress={createEvent}>
                <Text style={s.btnText}>Post linkup</Text>
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
  h: { fontSize: 22, fontWeight: '800', color: colors.ink, paddingHorizontal: 18, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: colors.line, borderWidth: 1, borderRadius: 18, marginHorizontal: 14, marginBottom: 12, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  date: { backgroundColor: colors.sea, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 11,
    alignItems: 'center', minWidth: 54 },
  dateD: { color: '#fff', fontWeight: '800', fontSize: 18 },
  dateM: { color: '#fff', fontWeight: '700', fontSize: 9, letterSpacing: 1 },
  title: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  rsvp: { borderWidth: 1.5, borderColor: colors.sea, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  rsvpOn: { backgroundColor: colors.sea },
  rsvpText: { fontSize: 11, fontWeight: '700', color: colors.seaDeep },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  fab: { position: 'absolute', bottom: Platform.OS === 'web' ? 90 : 20, alignSelf: 'center', backgroundColor: colors.hibiscus,
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
