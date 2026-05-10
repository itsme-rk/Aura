// ─── NewsHomeScreen ───────────────────────────────────────
//
// Main news feed with category tabs, article cards,
// pull-to-refresh, and save/read-later actions.
//

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, Linking, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNewsStore } from '../../../store/newsStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { NewsArticle, NewsCategory, NEWS_CATEGORY_LABELS, NEWS_CATEGORY_COLORS } from '../../../types';
import { emitEvent } from '../../../services/events/emitEvent';

interface NewsHomeScreenProps {
  onViewCategory: (category: NewsCategory) => void;
  onViewSaved: () => void;
}

export function NewsHomeScreen({ onViewCategory, onViewSaved }: NewsHomeScreenProps) {
  const articles = useNewsStore((s) => s.articles);
  const activeCategory = useNewsStore((s) => s.activeCategory);
  const isLoading = useNewsStore((s) => s.isLoading);
  const fetchArticles = useNewsStore((s) => s.fetchArticles);
  const setCategory = useNewsStore((s) => s.setCategory);
  const refreshFeed = useNewsStore((s) => s.refreshFeed);
  const saveArticle = useNewsStore((s) => s.saveArticle);
  const markReadLater = useNewsStore((s) => s.markReadLater);
  const loadSavedArticles = useNewsStore((s) => s.loadSavedArticles);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchArticles();
    loadSavedArticles();
  }, []);

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  }, [refreshFeed]);

  const handleArticlePress = useCallback((article: NewsArticle) => {
    emitEvent('ARTICLE_OPENED' as any, { articleId: article.id, title: article.title });
    Linking.openURL(article.link).catch(() => {});
  }, []);

  const categories: (NewsCategory | 'all')[] = ['all', 'cybersecurity', 'ai', 'technology'];

  const formatTime = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>News</Text>
              <TouchableOpacity onPress={onViewSaved} style={styles.savedBtn}>
                <Text style={styles.savedBtnText}>📑 Saved</Text>
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <View style={styles.tabRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tab, activeCategory === cat && styles.tabActive]}
                  onPress={() => {
                    setCategory(cat);
                    if (cat !== 'all') fetchArticles(cat);
                    else fetchArticles();
                  }}
                >
                  <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                    {cat === 'all' ? '📰 All' : NEWS_CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.articleCard}
            onPress={() => handleArticlePress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.articleHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: NEWS_CATEGORY_COLORS[item.category] + '22' }]}>
                <Text style={[styles.categoryBadgeText, { color: NEWS_CATEGORY_COLORS[item.category] }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.articleSource}>{item.source}</Text>
              <Text style={styles.articleTime}>{formatTime(item.publishedAt)}</Text>
            </View>

            <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>

            {item.summary ? (
              <Text style={styles.articleSummary} numberOfLines={2}>{item.summary}</Text>
            ) : null}

            <View style={styles.articleActions}>
              <TouchableOpacity
                onPress={() => saveArticle(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionText}>{item.isSaved ? '★' : '☆'} Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => markReadLater(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.actionText}>{item.isReadLater ? '✓' : '◷'} Later</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📰</Text>
            <Text style={styles.emptyText}>{isLoading ? 'Loading feeds...' : 'No articles found'}</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SPACING.md, marginBottom: SPACING.md,
  },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text },
  savedBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  savedBtnText: { ...TYPOGRAPHY.captionBold, color: COLORS.primary },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  tab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  tabText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  articleCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  articleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.sm },
  categoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  articleSource: { ...TYPOGRAPHY.small, color: COLORS.textMuted, flex: 1 },
  articleTime: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  articleTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: SPACING.xs },
  articleSummary: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  articleActions: { flexDirection: 'row', gap: SPACING.lg },
  actionText: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  emptySubtext: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: SPACING.xs },
});
