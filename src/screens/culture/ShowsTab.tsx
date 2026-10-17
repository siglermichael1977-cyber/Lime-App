import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors } from '../../theme';

interface Show {
  id: string;
  title: string;
  type: 'show' | 'movie';
  country: string;
  description: string;
  image: string;
  streamingLinks: { platform: string; url: string }[];
}

const CARIBBEAN_ENTERTAINMENT: Show[] = [
  {
    id: '2',
    title: 'Orange Is the New Black',
    type: 'show',
    country: 'USA/Caribbean Cast',
    description: 'Features Caribbean and Latin American characters',
    image: '🎭',
    streamingLinks: [],
  },
  {
    id: '5',
    title: 'Belly',
    type: 'movie',
    country: 'USA/Caribbean',
    description: 'Classic film featuring Caribbean music and culture',
    image: '🎵',
    streamingLinks: [],
  },
  {
    id: '6',
    title: 'Life and Debt',
    type: 'movie',
    country: 'Jamaica',
    description: 'Documentary about Caribbean economics and tourism',
    image: '📽️',
    streamingLinks: [],
  },
];

export default function ShowsTab() {
  const [selectedType, setSelectedType] = useState<'all' | 'show' | 'movie'>('all');

  const filtered = selectedType === 'all' ? CARIBBEAN_ENTERTAINMENT : CARIBBEAN_ENTERTAINMENT.filter(e => e.type === selectedType);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterBtn, selectedType === 'all' && s.filterBtnActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[s.filterBtnText, selectedType === 'all' && s.filterBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterBtn, selectedType === 'show' && s.filterBtnActive]}
            onPress={() => setSelectedType('show')}
          >
            <Text style={[s.filterBtnText, selectedType === 'show' && s.filterBtnTextActive]}>Shows</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterBtn, selectedType === 'movie' && s.filterBtnActive]}
            onPress={() => setSelectedType('movie')}
          >
            <Text style={[s.filterBtnText, selectedType === 'movie' && s.filterBtnTextActive]}>Movies</Text>
          </TouchableOpacity>
        </View>

        <View style={s.contentList}>
          {filtered.map(item => (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.icon}>{item.image}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.title2}>{item.title}</Text>
                  <Text style={s.type}>{item.type === 'show' ? '📺 Series' : '🎥 Movie'}</Text>
                  <Text style={s.country}>{item.country}</Text>
                </View>
              </View>

              <Text style={s.description}>{item.description}</Text>

              <View style={s.streamingRow}>
                {item.streamingLinks.map((link, idx) => (
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 6,
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
    backgroundColor: colors.sea,
    borderColor: colors.sea,
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
  title2: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  type: {
    fontSize: 12,
    color: colors.sea,
    fontWeight: '600',
    marginTop: 2,
  },
  country: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  description: {
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
