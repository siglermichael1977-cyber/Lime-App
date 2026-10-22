import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors, ISLANDS } from '../theme';
import ScreenBackdrop from '../components/ScreenBackdrop';
import { normalizeToJpegUri } from '../lib/heicToJpeg';
import { compressImage } from '../lib/imageUpload';
import { blockIfObjectionable } from '../lib/contentFilter';

const MAX_PHOTOS = 5;

export default function PropertyComposeScreen() {
  const nav = useNavigation<any>();
  const [listingType, setListingType] = useState<'land' | 'house'>('house');
  const [transactionType, setTransactionType] = useState<'sale' | 'rent'>('sale');
  const [island, setIsland] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);

  const pickPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('That’s enough photos', `You can add up to ${MAX_PHOTOS} photos per listing.`);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    setPhotosBusy(true);
    try {
      const normalized = await Promise.all(
        res.assets.map(a => normalizeToJpegUri(a.uri, a.mimeType)),
      );
      setPhotos(prev => [...prev, ...normalized].slice(0, MAX_PHOTOS));
    } catch (e: any) {
      console.error('Failed to process photos:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setPhotosBusy(false);
    }
  };

  const removePhoto = (uri: string) => setPhotos(prev => prev.filter(p => p !== uri));

  const submit = async () => {
    if (submittingRef.current) return;
    if (!island || !location.trim() || !price.trim()) {
      Alert.alert('Almost there', 'Fill in island, location, and price.');
      return;
    }
    if (!phone.trim() && !whatsapp.trim() && !email.trim()) {
      Alert.alert('Almost there', 'Add at least one way for people to reach you (phone, WhatsApp, or email).');
      return;
    }
    if (blockIfObjectionable(location, price, description)) return;
    submittingRef.current = true;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const photo_urls: string[] = [];
      for (const uri of photos) {
        let uploadUri = uri;
        try {
          uploadUri = await compressImage(uri);
        } catch (e: any) {
          console.error('Photo compression failed, uploading original:', e);
        }
        const fileName = `${user!.id}/${Date.now()}-${photo_urls.length}.jpg`;
        const file = await fetch(uploadUri).then(r => r.arrayBuffer());
        const { error: upErr } = await supabase.storage.from('property-photos')
          .upload(fileName, file, { contentType: 'image/jpeg' });
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
        photo_urls.push(supabase.storage.from('property-photos').getPublicUrl(fileName).data.publicUrl);
      }

      const { error } = await supabase.from('property_listings').insert({
        author_id: user!.id,
        listing_type: listingType,
        transaction_type: transactionType,
        island,
        location: location.trim(),
        price: price.trim(),
        description: description.trim(),
        photo_urls,
        contact_phone: phone.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
        contact_email: email.trim() || null,
      });
      if (error) throw error;
      nav.goBack();
    } catch (e: any) {
      console.error('Failed to post listing:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.label}>Type</Text>
        <View style={s.row}>
          <TouchableOpacity style={[s.toggle, listingType === 'house' && s.toggleOn]} onPress={() => setListingType('house')}>
            <Text style={[s.toggleText, listingType === 'house' && s.toggleTextOn]}>🏠 House</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggle, listingType === 'land' && s.toggleOn]} onPress={() => setListingType('land')}>
            <Text style={[s.toggleText, listingType === 'land' && s.toggleTextOn]}>🌱 Land</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>For</Text>
        <View style={s.row}>
          <TouchableOpacity style={[s.toggle, transactionType === 'sale' && s.toggleOn]} onPress={() => setTransactionType('sale')}>
            <Text style={[s.toggleText, transactionType === 'sale' && s.toggleTextOn]}>Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggle, transactionType === 'rent' && s.toggleOn]} onPress={() => setTransactionType('rent')}>
            <Text style={[s.toggleText, transactionType === 'rent' && s.toggleTextOn]}>Rent</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Island</Text>
        <View style={s.chips}>
          {ISLANDS.map(i => (
            <TouchableOpacity key={i} style={[s.chip, island === i && s.chipOn]} onPress={() => setIsland(i)}>
              <Text style={[s.chipText, island === i && s.chipTextOn]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} placeholder="Location / area (e.g. Mandeville, Manchester)" placeholderTextColor="#8FA6A1"
          value={location} onChangeText={setLocation} />
        <TextInput style={s.input} placeholder="Price (e.g. $250,000 or $1,200/month)" placeholderTextColor="#8FA6A1"
          value={price} onChangeText={setPrice} />
        <TextInput style={[s.input, s.textarea]} placeholder="Description" placeholderTextColor="#8FA6A1"
          multiline value={description} onChangeText={setDescription} />

        <Text style={s.label}>Photos ({photos.length}/{MAX_PHOTOS})</Text>
        <View style={s.photoRow}>
          {photos.map(uri => (
            <TouchableOpacity key={uri} onLongPress={() => removePhoto(uri)}>
              <Image source={{ uri }} style={s.photoThumb} />
            </TouchableOpacity>
          ))}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={s.addPhoto} onPress={pickPhotos} disabled={photosBusy}>
              <Text style={s.addPhotoText}>{photosBusy ? '…' : '+ Photo'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={s.hint}>Tap and hold a photo to remove it.</Text>

        <Text style={s.label}>Contact info (at least one)</Text>
        <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#8FA6A1"
          keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={s.input} placeholder="WhatsApp number" placeholderTextColor="#8FA6A1"
          keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#8FA6A1"
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
          <Text style={s.btnText}>{busy ? 'Posting…' : 'Post listing'}</Text>
        </TouchableOpacity>
        <Text style={s.note}>
          By posting, you confirm this listing is yours to share. LIME does not broker, verify, or guarantee
          any property transaction — buyers and sellers deal directly at their own risk.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 18, paddingBottom: Platform.OS === 'web' ? 110 : 50 },
  label: { fontWeight: '800', fontSize: 13, color: colors.ink, marginBottom: 8, marginTop: 14 },
  row: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  toggleOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  toggleText: { fontWeight: '700', fontSize: 13.5, color: colors.ink },
  toggleTextOn: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.mango, borderColor: colors.mango },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: colors.ink, fontWeight: '800' },
  input: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1.5, borderRadius: 14,
    padding: 13, marginTop: 12, fontSize: 14, color: colors.ink },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 76, height: 76, borderRadius: 12 },
  addPhoto: { width: 76, height: 76, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  addPhotoText: { fontSize: 11.5, fontWeight: '700', color: colors.muted, textAlign: 'center' },
  hint: { fontSize: 11, color: colors.muted, marginTop: 6 },
  btn: { backgroundColor: colors.hibiscus, borderRadius: 999, padding: 16, marginTop: 24,
    shadowColor: colors.hibiscus, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  note: { fontSize: 11, color: colors.muted, marginTop: 14, textAlign: 'center', lineHeight: 16 },
});
