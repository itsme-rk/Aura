// ─── SavedArticlesScreen ──────────────────────────────────
//
// Shows saved and read-later articles.
//

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNewsStore } from '../../../store/newsStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { NewsArticle, NEWS_CATEGORY_COLORS } from '../../../types';

interface SavedArticlesScreenProps {
  onBack: () => void;
}

export function SavedArticlesScreen({ onBack }: SavedArticlesScreenProps) {
  const savedArticles = useNewsStore((s) => s.savedArticles);
  const readLaterArticles = useNewsStore((s) => s.readLaterArticles);
  const unsaveArticle = useNewsStore((s) => s.unsaveArticle);
  const removeReadLater = useNewsStore((s) => s.removeReadLater);
  const loadSavedArticles = useNewsStore((s) => s.loadSavedArticles);
  const loadReadLater = useNewsStore((s) => s.loadReadLater);

  const [tab, setTab] = useState<'saved' | 'later'>('saved');

  useEffect(() => {
    loadSavedArticles();
    loadReadLater();
  }, []);

  const data = tab === 'saved' ? savedArticles : readLaterArticles;

  const formatTime = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
        >
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            ★ Saved ({savedArticles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'later' && styles.tabActive]}
          onPress={() => setTab('later')}
        >
          <Text style={[styles.tabText, tab === 'later' && styles.tabTextActive]}>
            ◷ Read Later ({readLaterArticles.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL(item.link).catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: NEWS_CATEGORY_COLORS[item.category] + '22' }]}>
                <Text style={[styles.badgeText, { color: NEWS_CATEGORY_COLORS[item.category] }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.source}>{item.source} · {formatTime(item.publishedAt)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => tab === 'saved' ? unsaveArticle(item.id) : removeReadLater(item.id)}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'saved' ? '📑' : '⏰'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'saved' ? 'No saved articles' : 'No read-later articles'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, marginBottom: SPACING.md,
  },
  backBtn: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  tabRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  tabText: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  source: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  cardTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: SPACING.sm },
  removeBtn: { alignSelf: 'flex-start' },
  removeBtnText: { ...TYPOGRAPHY.small, color: COLORS.error },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
});
