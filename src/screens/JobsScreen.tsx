import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { Job } from '../lib/types';
import { openExternal } from '../lib/openExternal';
import ScreenBackdrop from '../components/ScreenBackdrop';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'on-island', label: 'On-island' },
  { key: 'remote', label: 'Remote' },
  { key: 'diaspora', label: 'Diaspora' },
  { key: 'owned', label: 'Caribbean-owned' },
];

const JOB_SITES = [
  { name: 'Caribbean Jobs', url: 'https://www.caribbeanjobs.com', description: 'Region-wide job listings across the Caribbean.' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', description: 'Professional network with global job search.' },
  { name: 'Indeed', url: 'https://www.indeed.com', description: 'One of the world’s largest job search engines.' },
  { name: 'Monster', url: 'https://www.monster.com', description: 'Global job board with resume tools.' },
];

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    let q = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(50);
    if (filter === 'owned') q = q.eq('caribbean_owned', true);
    else if (filter !== 'all') q = q.eq('kind', filter);
    const { data } = await q;
    setJobs(data ?? []);
  }, [filter]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.wrap}>
      <ScreenBackdrop />
      <Text style={s.h}>Wuk & Hustle 💼</Text>
      <View style={s.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} style={[s.pill, filter === f.key && s.pillOn]}
            onPress={() => { setFilter(f.key); }}>
            <Text style={[s.pillText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        ListHeaderComponent={
          <View style={s.sitesBox}>
            <Text style={s.sitesTitle}>Browse more job sites 🔗</Text>
            {JOB_SITES.map(site => (
              <TouchableOpacity key={site.name} style={s.siteRow} onPress={() => openExternal(site.url)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.siteName}>{site.name}</Text>
                  <Text style={s.siteDesc}>{site.description}</Text>
                </View>
                <Text style={s.siteArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.meta}>{item.company} · {item.location}</Text>
              <View style={s.tags}>
                <Text style={s.tag}>{item.kind}</Text>
                {item.caribbean_owned && <Text style={s.tag}>Caribbean-owned</Text>}
              </View>
            </View>
            {item.apply_url && (
              <TouchableOpacity style={s.apply} onPress={() => openExternal(item.apply_url!)}>
                <Text style={s.applyText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>No jobs posted yet in this category. Check back soon. 💼</Text>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'transparent', paddingTop: 54 },
  h: { fontSize: 22, fontWeight: '800', color: colors.ink, paddingHorizontal: 18, marginBottom: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, marginBottom: 12 },
  pill: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 13 },
  pillOn: { backgroundColor: colors.seaDeep, borderColor: colors.seaDeep },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line,
    borderWidth: 1, borderRadius: 18, marginHorizontal: 14, marginBottom: 12, padding: 15, gap: 10,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  title: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 7 },
  tag: { fontSize: 10, fontWeight: '700', color: colors.seaDeep, backgroundColor: colors.sky,
    borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8, overflow: 'hidden' },
  apply: { backgroundColor: colors.sea, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15 },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 40, lineHeight: 20 },
  sitesBox: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: colors.line, borderWidth: 1, borderRadius: 18,
    marginHorizontal: 14, marginBottom: 16, padding: 15,
    shadowColor: colors.seaDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sitesTitle: { fontWeight: '800', fontSize: 13.5, color: colors.ink, marginBottom: 8 },
  siteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: colors.line },
  siteName: { fontWeight: '700', fontSize: 13, color: colors.seaDeep },
  siteDesc: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  siteArrow: { fontSize: 16, color: colors.sea, marginLeft: 8 },
});
