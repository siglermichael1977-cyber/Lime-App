import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors } from '../../theme';

interface Artist {
  id: string;
  name: string;
  genre: string;
  country: string;
  bio: string;
  icon: string;
  streamingLinks: { platform: string; url: string }[];
}

const CARIBBEAN_ARTISTS: Artist[] = [
  {
    id: '1',
    name: 'Bob Marley',
    genre: 'Reggae',
    country: 'Jamaica',
    bio: 'Reggae legend and cultural icon',
    icon: '👑',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Bob%20Marley' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Bob%20Marley' },
    ],
  },
  {
    id: '2',
    name: 'Sean Paul',
    genre: 'Dancehall/Reggae',
    country: 'Jamaica',
    bio: 'Dancehall pioneer with global hits',
    icon: '🎤',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Sean%20Paul' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Sean%20Paul' },
      { platform: 'YouTube Music', url: 'https://music.youtube.com/search?q=Sean%20Paul' },
    ],
  },
  {
    id: '3',
    name: 'Rihanna',
    genre: 'Pop/R&B',
    country: 'Barbados',
    bio: 'Multi-platinum Caribbean icon',
    icon: '💎',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Rihanna' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Rihanna' },
    ],
  },
  {
    id: '4',
    name: 'Shaggy',
    genre: 'Reggae/Dancehall',
    country: 'Jamaica',
    bio: 'Grammy-winning reggae artist',
    icon: '🎸',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Shaggy' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Shaggy' },
    ],
  },
  {
    id: '5',
    name: 'Chronixx',
    genre: 'Reggae',
    country: 'Jamaica',
    bio: 'Modern reggae roots ambassador',
    icon: '🔥',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Chronixx' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Chronixx' },
    ],
  },
  {
    id: '6',
    name: 'Beenie Man',
    genre: 'Dancehall',
    country: 'Jamaica',
    bio: 'King of the Dancehall',
    icon: '👸',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Beenie%20Man' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Beenie%20Man' },
    ],
  },
  {
    id: '7',
    name: 'Machel Montano',
    genre: 'Soca',
    country: 'Trinidad & Tobago',
    bio: 'Soca superstar and innovator',
    icon: '🎊',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Machel%20Montano' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Machel%20Montano' },
    ],
  },
  {
    id: '8',
    name: 'Ky-Mani Marley',
    genre: 'Reggae',
    country: 'Jamaica',
    bio: 'Bob Marley\'s son, reggae artist',
    icon: '🌿',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Ky-Mani%20Marley' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Ky-Mani%20Marley' },
    ],
  },
  {
    id: '9',
    name: 'Popcaan',
    genre: 'Dancehall',
    country: 'Jamaica',
    bio: 'Modern dancehall sensation',
    icon: '🎵',
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/search/Popcaan' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/search?term=Popcaan' },
    ],
  },
];

export default function ArtistsTab() {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const genres = ['all', ...new Set(CARIBBEAN_ARTISTS.map(a => a.genre))];
  const filtered = selectedGenre === 'all' ? CARIBBEAN_ARTISTS : CARIBBEAN_ARTISTS.filter(a => a.genre === selectedGenre);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          <View style={s.filterRow}>
            {genres.map(genre => (
              <TouchableOpacity
                key={genre}
                style={[s.filterBtn, selectedGenre === genre && s.filterBtnActive]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[s.filterBtnText, selectedGenre === genre && s.filterBtnTextActive]}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.contentList}>
          {filtered.map(artist => (
            <View key={artist.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.icon}>{artist.icon}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.name}>{artist.name}</Text>
                  <Text style={s.genre}>{artist.genre}</Text>
                  <Text style={s.country}>🏝️ {artist.country}</Text>
                </View>
              </View>

              <Text style={s.bio}>{artist.bio}</Text>

              <View style={s.streamingRow}>
                {artist.streamingLinks.map((link, idx) => (
                  <TouchableOpacity key={idx} style={s.streamBtn} onPress={() => openLink(link.url)}>
                    <Text style={s.streamBtnText}>{link.platform}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  filterScroll: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: colors.mango,
    borderColor: colors.mango,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  contentList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
    shadowColor: colors.seaDeep,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  icon: {
    fontSize: 40,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  genre: {
    fontSize: 12,
    color: colors.mango,
    fontWeight: '600',
    marginTop: 2,
  },
  country: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginBottom: 10,
  },
  streamingRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  streamBtn: {
    backgroundColor: colors.sky,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  streamBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.seaDeep,
  },
});
