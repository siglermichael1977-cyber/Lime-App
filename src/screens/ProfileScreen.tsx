import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Linking, Modal, Platform, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors, islandColor, LOOKING_FOR_OPTIONS } from '../theme';
import { Profile } from '../lib/types';
import ScreenBackdrop from '../components/ScreenBackdrop';
import Avatar from '../components/Avatar';
import { pickAndUploadAvatar } from '../lib/avatarUpload';
import { openExternal } from '../lib/openExternal';
import { instagramUrl, facebookUrl, tiktokUrl, xUrl, whatsappUrl } from '../lib/socialLinks';
import { leaveGuest } from '../lib/guest';

const CONTACT_URL = 'mailto:mykkesigler@icloud.com';

export default function ProfileScreen() {
  const [me, setMe] = useState<Profile | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showLookingFor, setShowLookingFor] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioBusy, setBioBusy] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorBusy, setCreatorBusy] = useState(false);
  const [guest, setGuest] = useState(false);

  const changePhoto = async () => {
    if (!me) return;
    setAvatarBusy(true);
    try {
      const url = await pickAndUploadAvatar(me.id);
      if (!url) return;
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', me.id);
      if (error) throw error;
      setMe({ ...me, avatar_url: url });
    } catch (e: any) {
      console.error('Failed to update avatar:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const updateLookingFor = async (value: string | null) => {
    if (!me) return;
    setShowLookingFor(false);
    try {
      const { error } = await supabase.from('profiles').update({ looking_for: value }).eq('id', me.id);
      if (error) throw error;
      setMe({ ...me, looking_for: value });
    } catch (e: any) {
      console.error('Failed to update looking_for:', e);
      Alert.alert('Something went wrong', e.message);
    }
  };

  const openBioEditor = () => {
    setBioDraft(me?.bio ?? '');
    setShowBio(true);
  };

  const saveBio = async () => {
    if (!me) return;
    setBioBusy(true);
    try {
      const trimmed = bioDraft.trim();
      const { error } = await supabase.from('profiles').update({ bio: trimmed }).eq('id', me.id);
      if (error) throw error;
      setMe({ ...me, bio: trimmed });
      setShowBio(false);
    } catch (e: any) {
      console.error('Failed to update bio:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setBioBusy(false);
    }
  };

  const toggleCreatorStatus = async (value: boolean) => {
    if (!me) return;
    setCreatorBusy(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_creator: value }).eq('id', me.id);
      if (error) throw error;
      setIsCreator(value);
      setMe({ ...me, is_creator: value });

      // If toggling ON, create a creator_profile row
      if (value) {
        const { error: creatorError } = await supabase
          .from('creator_profiles')
          .upsert({ id: me.id, follower_count: 0, following_count: 0 });
        if (creatorError) console.error('Failed to create creator profile:', creatorError);
      }
    } catch (e: any) {
      console.error('Failed to update creator status:', e);
      Alert.alert('Something went wrong', e.message);
    } finally {
      setCreatorBusy(false);
    }
  };

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setGuest(user.is_anonymous ?? false);
      if (user.is_anonymous) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setMe(data);
        setIsCreator(data.is_creator || false);
      }
    });
  }, []));

  const deleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, posts, and family tree. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            // The function deletes whoever the session token belongs to.
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('Something went wrong', 'Your account could not be deleted. Please try again.');
              return;
            }
            // The user is gone server-side, so only clear the local session.
            await supabase.auth.signOut({ scope: 'local' });
          },
        },
      ],
    );
  };

  // Guests have no profile row; give them a way to sign up or leave.
  if (guest) {
    return (
      <View style={s.wrap}>
        <ScreenBackdrop />
        <Text style={s.guestWave}>👋🏾</Text>
        <Text style={s.name}>Welcome to de yard</Text>
        <Text style={s.guestText}>
          You're browsing as a guest. Make an account to post, comment, follow creators, and build your profile.
        </Text>
        <TouchableOpacity style={s.guestPrimary} onPress={() => leaveGuest('signup')}>
          <Text style={s.guestPrimaryText}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.guestSecondary} onPress={() => leaveGuest('signin')}>
          <Text style={s.guestSecondaryText}>Sign in</Text>
        </TouchableOpacity>
        <View style={s.links}>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(CONTACT_URL)}>
            <Text style={s.rowText}>Contact us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row}
            onPress={() => Linking.openURL('https://limeappfinal.netlify.app/privacy')}>
            <Text style={s.rowText}>Privacy policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row}
            onPress={() => Linking.openURL('https://limeappfinal.netlify.app/terms')}>
            <Text style={s.rowText}>Terms of service</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!me) return <View style={s.wrap}><ScreenBackdrop /></View>;

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <TouchableOpacity onPress={changePhoto} disabled={avatarBusy}>
        <Avatar uri={me.avatar_url} letter={me.display_name[0]} size={84}
          bgColor={islandColor(me.island)} borderWidth={3} borderColor={colors.mango} />
      </TouchableOpacity>
      <TouchableOpacity onPress={changePhoto} disabled={avatarBusy}>
        <Text style={s.changePhoto}>{avatarBusy ? 'Uploading…' : 'Change photo'}</Text>
      </TouchableOpacity>
      <Text style={s.name}>{me.display_name}</Text>
      <Text style={s.username}>@{me.username}</Text>

      {isCreator && <Text style={s.creatorBadge}>✨ Creator</Text>}

      <View style={s.badges}>
        <Text style={s.badge}>🏝️ {me.island}</Text>
        <Text style={s.badge}>
          {me.current_location === 'Home' ? '🏠 Home on island' : `✈️ ${me.current_location}`}
        </Text>
      </View>

      <TouchableOpacity onPress={() => setShowLookingFor(true)}>
        {me.looking_for ? (
          <Text style={[s.badge, s.vibeBadge]}>{me.looking_for}</Text>
        ) : (
          <Text style={s.addVibe}>+ Add a vibe</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showLookingFor} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>What's your vibe? 💫</Text>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <TouchableOpacity key={opt} style={s.optionRow} onPress={() => updateLookingFor(opt)}>
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            {me.looking_for && (
              <TouchableOpacity style={s.optionRow} onPress={() => updateLookingFor(null)}>
                <Text style={[s.optionText, { color: colors.hibiscus }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowLookingFor(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={openBioEditor} style={s.bioBox}>
        {me.bio ? (
          <Text style={s.bioText}>{me.bio}</Text>
        ) : (
          <Text style={s.addBio}>+ Add a bio</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showBio} animationType="slide" transparent>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>Your bio</Text>
            <TextInput style={s.bioInput} placeholder="Tell de yard a little about yourself…"
              placeholderTextColor="#8FA6A1" multiline maxLength={150}
              value={bioDraft} onChangeText={setBioDraft} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={s.cancelSheetBtn} onPress={() => setShowBio(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={saveBio} disabled={bioBusy}>
                <Text style={s.saveBtnText}>{bioBusy ? '…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {(me.instagram_url || me.facebook_url || me.tiktok_url || me.x_url || me.whatsapp || me.phone) && (
        <View style={s.links}>
          {me.instagram_url && (
            <TouchableOpacity style={s.row} onPress={() => openExternal(instagramUrl(me.instagram_url!))}>
              <Text style={s.rowText}>📸 Instagram</Text>
            </TouchableOpacity>
          )}
          {me.facebook_url && (
            <TouchableOpacity style={s.row} onPress={() => openExternal(facebookUrl(me.facebook_url!))}>
              <Text style={s.rowText}>📘 Facebook</Text>
            </TouchableOpacity>
          )}
          {me.tiktok_url && (
            <TouchableOpacity style={s.row} onPress={() => openExternal(tiktokUrl(me.tiktok_url!))}>
              <Text style={s.rowText}>🎵 TikTok</Text>
            </TouchableOpacity>
          )}
          {me.x_url && (
            <TouchableOpacity style={s.row} onPress={() => openExternal(xUrl(me.x_url!))}>
              <Text style={s.rowText}>✖️ X</Text>
            </TouchableOpacity>
          )}
          {me.whatsapp && (
            <TouchableOpacity style={s.row} onPress={() => openExternal(whatsappUrl(me.whatsapp!))}>
              <Text style={s.rowText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          )}
          {me.phone && (
            <TouchableOpacity style={s.row} onPress={() => Linking.openURL(`tel:${me.phone}`)}>
              <Text style={s.rowText}>📞 {me.phone}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.links}>
        <View style={s.creatorToggleRow}>
          <View>
            <Text style={s.rowText}>I'm a creator</Text>
            <Text style={s.creatorSubtext}>Promote yourself in our Creator Hub</Text>
          </View>
          <Switch
            value={isCreator}
            onValueChange={toggleCreatorStatus}
            disabled={creatorBusy}
            trackColor={{ false: colors.line, true: colors.sea }}
            thumbColor={isCreator ? colors.mango : colors.muted}
          />
        </View>
      </View>

      <View style={s.links}>
        <TouchableOpacity style={s.row} onPress={() => supabase.auth.signOut()}>
          <Text style={s.rowText}>Sign out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.row} onPress={() => Linking.openURL(CONTACT_URL)}>
          <Text style={s.rowText}>Contact us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.row}
          onPress={() => Linking.openURL('https://limeappfinal.netlify.app/privacy')}>
          <Text style={s.rowText}>Privacy policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.row}
          onPress={() => Linking.openURL('https://limeappfinal.netlify.app/terms')}>
          <Text style={s.rowText}>Terms of service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.row} onPress={deleteAccount}>
          <Text style={[s.rowText, { color: colors.hibiscus }]}>Delete account</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.copyright}>© 2025 LIME — De Whole Caribbean, One Yard. All rights reserved.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', paddingTop: 80 },
  changePhoto: { color: colors.sea, fontWeight: '700', fontSize: 12.5, marginTop: 8 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 8 },
  username: { fontSize: 13, color: colors.muted, marginTop: 2 },
  creatorBadge: { fontSize: 12, fontWeight: '700', color: colors.mango, marginTop: 8 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { backgroundColor: colors.sky, color: colors.seaDeep, fontWeight: '700', fontSize: 12,
    borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, overflow: 'hidden' },
  vibeBadge: { backgroundColor: colors.hibiscus, color: '#fff', marginTop: 10 },
  addVibe: { color: colors.sea, fontWeight: '700', fontSize: 12.5, marginTop: 10 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(9,63,58,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22,
    paddingBottom: Platform.OS === 'web' ? 110 : 40 },
  sheetH: { fontSize: 18, fontWeight: '800', marginBottom: 14, color: colors.ink },
  optionRow: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  cancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  bioBox: { marginTop: 14, paddingHorizontal: 24, maxWidth: '90%' },
  bioText: { fontSize: 13.5, color: colors.ink, textAlign: 'center', lineHeight: 19 },
  addBio: { fontSize: 12.5, color: colors.sea, fontWeight: '700', textAlign: 'center' },
  bioInput: { backgroundColor: colors.foam, borderColor: colors.line, borderWidth: 1.5, borderRadius: 14,
    padding: 13, minHeight: 90, fontSize: 14, color: colors.ink, textAlignVertical: 'top' },
  cancelSheetBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: 999, padding: 14 },
  saveBtn: { flex: 1, backgroundColor: colors.sea, borderRadius: 999, padding: 14 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  links: { marginTop: 36, width: '86%', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  creatorToggleRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creatorSubtext: { fontSize: 12, color: colors.muted, marginTop: 3 },
  rowText: { fontWeight: '600', color: colors.ink, fontSize: 14 },
  guestWave: { fontSize: 44 },
  guestText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8,
    width: '86%', maxWidth: 420 },
  guestPrimary: { marginTop: 24, width: '86%', maxWidth: 420, backgroundColor: colors.hibiscus, borderRadius: 999, padding: 15 },
  guestPrimaryText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
  guestSecondary: { marginTop: 12, width: '86%', maxWidth: 420, borderWidth: 1.5, borderColor: colors.sea, borderRadius: 999, padding: 14 },
  guestSecondaryText: { color: colors.sea, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  copyright: { fontSize: 10.5, color: colors.muted, marginTop: 28, marginBottom: 20, textAlign: 'center' },
});
