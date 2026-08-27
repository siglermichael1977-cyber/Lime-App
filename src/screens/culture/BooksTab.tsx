import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { openExternal } from '../../lib/openExternal';

type Book = { title: string; author: string; description: string };
type BookSection = { title: string; data: Book[] };

// Search links (not guessed product pages) — always correct regardless of
// which specific edition/listing exists on each site.
function searchLinks(title: string, author: string) {
  const q = encodeURIComponent(`${title} ${author}`);
  return {
    goodreads: `https://www.goodreads.com/search?q=${q}`,
    amazon: `https://www.amazon.com/s?k=${q}`,
    worldcat: `https://www.worldcat.org/search?q=${q}`,
  };
}

const BOOKS: BookSection[] = [
  { title: 'Saint Lucia', data: [
    { title: 'Omeros', author: 'Derek Walcott', description: 'An epic poem reimagining Homer in the Caribbean, by the 1992 Nobel laureate in Literature.' },
  ] },
  { title: 'Trinidad & Tobago', data: [
    { title: 'A House for Mr Biswas', author: 'V.S. Naipaul', description: 'A modern classic following one man’s lifelong search for independence and a home of his own.' },
    { title: 'The Dragon Can’t Dance', author: 'Earl Lovelace', description: 'A vivid portrait of Port of Spain life through the lens of Carnival.' },
    { title: 'Crick Crack, Monkey', author: 'Merle Hodge', description: 'A coming-of-age novel about a girl caught between two ways of life in Trinidad.' },
  ] },
  { title: 'Jamaica', data: [
    { title: 'Abeng', author: 'Michelle Cliff', description: 'A coming-of-age story exploring race, class, and colonial history in Jamaica.' },
  ] },
  { title: 'Antigua', data: [
    { title: 'Annie John', author: 'Jamaica Kincaid', description: 'A lyrical coming-of-age novel about a girl growing up in Antigua.' },
  ] },
  { title: 'Barbados', data: [
    { title: 'In the Castle of My Skin', author: 'George Lamming', description: 'A landmark novel of village life in 1930s-40s colonial Barbados.' },
    { title: 'Brown Girl, Brownstones', author: 'Paule Marshall', description: 'A Barbadian-American family navigates identity and ambition in Brooklyn.' },
  ] },
  { title: 'Haiti', data: [
    { title: 'Breath, Eyes, Memory', author: 'Edwidge Danticat', description: 'A powerful novel of mothers, daughters, and generational trauma in Haiti and New York.' },
  ] },
  { title: 'Folklore & Anansi Tales', data: [
    { title: 'Anansi the Spider Tales', author: 'Traditional (Caribbean & West African folklore)', description: 'The trickster spider Anansi’s stories traveled from West Africa across the Caribbean and remain a cornerstone of the region’s oral tradition.' },
  ] },
];

export default function BooksTab() {
  return (
    <SectionList
      sections={BOOKS}
      keyExtractor={(item, i) => item.title + i}
      renderSectionHeader={({ section }) => <Text style={s.sectionTitle}>{section.title}</Text>}
      renderItem={({ item }) => {
        const links = searchLinks(item.title, item.author);
        return (
          <View style={s.card}>
            <Text style={s.bookTitle}>{item.title}</Text>
            <Text style={s.bookAuthor}>{item.author}</Text>
            <Text style={s.bookDesc}>{item.description}</Text>
            <View style={s.linkRow}>
              <TouchableOpacity style={s.linkBtn} onPress={() => openExternal(links.goodreads)}>
                <Text style={s.linkBtnText}>Goodreads</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={() => openExternal(links.amazon)}>
                <Text style={s.linkBtnText}>Amazon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={() => openExternal(links.worldcat)}>
                <Text style={s.linkBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      ListHeaderComponent={<Text style={s.sub}>Notable Caribbean literature and folklore, grouped by island.</Text>}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
      stickySectionHeadersEnabled={false}
    />
  );
}

const s = StyleSheet.create({
  sub: { fontSize: 12.5, color: colors.muted, paddingHorizontal: 4, marginBottom: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.seaDeep,
    paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 16,
    marginBottom: 10, padding: 14,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  bookTitle: { fontWeight: '800', fontSize: 15, color: colors.ink },
  bookAuthor: { fontSize: 12.5, color: colors.seaDeep, fontWeight: '600', marginTop: 2 },
  bookDesc: { fontSize: 12.5, color: colors.muted, marginTop: 6, lineHeight: 18 },
  linkRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  linkBtn: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.foam, borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 12 },
  linkBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.seaDeep },
});
