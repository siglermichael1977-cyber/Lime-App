import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, StyleSheet, Linking, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { requireAccount } from '../lib/guest';
import { fetchBlockedIds, openReportBlockMenu } from '../lib/moderation';
import { colors, ISLANDS } from '../theme';
import { PropertyListing } from '../lib/types';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { openExternal } from '../lib/openExternal';
import { whatsappUrl } from '../lib/socialLinks';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'sale', label: 'For sale' },
  { key: 'rent', label: 'For rent' },
];

function storagePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

export default function PropertyScreen() {
  const nav = useNavigation<any>();
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [myId, setMyId] = useState('');
  const [txFilter, setTxFilter] = useState('all');
  const [islandFilter, setIslandFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);

    let q = supabase.from('property_listings')
      .select('*, profiles!property_listings_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (txFilter !== 'all') q = q.eq('transaction_type', txFilter);
    if (islandFilter) q = q.eq('island', islandFilter);
    const { data, error } = await q;
    if (error) { console.error('Failed to load listings:', error); return; }
    const blocked = await fetchBlockedIds();
    setListings((data ?? []).filter(l => !blocked.has(l.author_id)));
  }, [txFilter, islandFilter]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deleteListing = async (item: PropertyListing) => {
    try {
      for (const url of item.photo_urls ?? []) {
        const path = storagePathFromPublicUrl(url, 'property-photos');
        if (path) {
          const { error } = await supabase.storage.from('property-photos').remove([path]);
          if (error) console.error('Failed to delete listing photo:', error);
        }
      }
      const { error } = await supabase.from('property_listings').delete().eq('id', item.id);
      if (error) throw error;
      load();
    } catch (e: any) {
      console.error('Failed to delete listing:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  const confirmDelete = (item: PropertyListing) => {
    Alert.alert('Delete this listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteListing(item) },
    ]);
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <Text style={s.disclaimer}>
        ⚠️ Listings are posted directly by users. LIME does not broker, verify, or guarantee any property,
        price, or transaction — deal with buyers/sellers/landlords directly and at your own risk.
      </Text>
      <View style={s.pills}>
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[s.pill, txFilter === f.key && s.pillOn]} onPress={() => setTxFilter(f.key)}>
            <Text style={[s.pillText, txFilter === f.key && s.pillTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.pills}>
        <TouchableOpacity style={[s.pill, !islandFilter && s.pillOn]} onPress={() => setIslandFilter(null)}>
          <Text style={[s.pillText, !islandFilter && s.pillTextOn]}>All islands</Text>
        </TouchableOpacity>
        {ISLANDS.map(i => (
          <TouchableOpacity key={i} style={[s.pill, islandFilter === i && s.pillOn]} onPress={() => setIslandFilter(i)}>
            <Text style={[s.pillText, islandFilter === i && s.pillTextOn]}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.photo_urls?.[0] && <Image source={{ uri: item.photo_urls[0] }} style={s.photo} />}
            <View style={s.cardBody}>
              <View style={s.headRow}>
                <Text style={s.price}>{item.price}</Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{item.listing_type === 'land' ? '🌱 Land' : '🏠 House'} · {item.transaction_type === 'sale' ? 'Sale' : 'Rent'}</Text>
                </View>
              </View>
              <Text style={s.location}>{item.location}, {item.island}</Text>
              {!!item.description && <Text style={s.desc}>{item.description}</Text>}
              <Text style={s.poster}>Posted by {item.profiles?.display_name ?? 'Cousin'}</Text>
              <View style={s.contactRow}>
                {item.contact_whatsapp && (
                  <TouchableOpacity style={s.contactBtn} onPress={() => openExternal(whatsappUrl(item.contact_whatsapp!))}>
                    <Text style={s.contactBtnText}>💬 WhatsApp</Text>
                  </TouchableOpacity>
                )}
                {item.contact_phone && (
                  <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${item.contact_phone}`)}>
                    <Text style={s.contactBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
                {item.contact_email && (
                  <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`mailto:${item.contact_email}`)}>
                    <Text style={s.contactBtnText}>✉️ Email</Text>
                  </TouchableOpacity>
                )}
                {item.author_id === myId ? (
                  <TouchableOpacity style={[s.contactBtn, { marginLeft: 'auto' }]} onPress={() => confirmDelete(item)}>
                    <Text style={s.contactBtnText}>🗑️</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{ marginLeft: 'auto' }} hitSlop={10} onPress={() => openReportBlockMenu({
                    contentType: 'property_listing', contentId: item.id, authorId: item.author_id,
                    authorName: item.profiles?.display_name, onBlocked: load,
                  })}>
                    <Text style={s.more}>⋯</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No listings yet — post the first one. 🏡</Text>}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <TouchableOpacity style={s.fab} onPress={async () => {
        if (await requireAccount('post a listing')) return;
        nav.navigate('PropertyCompose');
      }}>
        <Text style={s.fabText}>+ Post a listing</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 20 },
  disclaimer: { fontSize: 11.5, color: colors.muted, paddingHorizontal: 18, marginBottom: 10, lineHeight: 16 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 10 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 13 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  pillTextOn: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 18,
    marginHorizontal: 14, marginBottom: 14, overflow: 'hidden',
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  photo: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontWeight: '800', fontSize: 17, color: colors.seaDeep },
  badge: { backgroundColor: colors.sky, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: colors.seaDeep },
  location: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: 4 },
  desc: { fontSize: 12.5, color: colors.muted, marginTop: 6, lineHeight: 18 },
  poster: { fontSize: 11, color: colors.muted, marginTop: 8 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' },
  contactBtn: { backgroundColor: colors.sea, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  more: { fontSize: 18, fontWeight: '700', color: '#41615B', paddingHorizontal: 4 },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 11.5 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 40, lineHeight: 20 },
  fab: { position: 'absolute', bottom: Platform.OS === 'web' ? 90 : 20, alignSelf: 'center', backgroundColor: colors.hibiscus,
    borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
