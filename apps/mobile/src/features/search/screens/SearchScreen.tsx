// ─── SearchScreen ─────────────────────────────────────────
//
// Universal search with domain tabs, debounced input,
// recent searches, and categorized results.
//

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSearchStore } from '../../../store/searchStore';
import { useWorkoutStore } from '../../../store';
import { useNewsStore } from '../../../store/newsStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { SearchDomain, SearchResult, UniversalSearchInput } from '../services/search.service';
import { DEFAULT_FOODS } from '../../nutrition/data/foodLibrary';
import { emitEvent } from '../../../services/events/emitEvent';

interface SearchScreenProps {
  onBack: () => void;
  onViewExercise?: (exerciseId: string) => void;
}

const DOMAIN_LABELS: Record<SearchDomain, string> = {
  all: '🔍 All',
  exercises: '🏋️ Exercises',
  foods: '🥩 Foods',
  articles: '📰 Articles',
  products: '📦 Products',
};

const DEBOUNCE_MS = 300;

export function SearchScreen({ onBack, onViewExercise }: SearchScreenProps) {
  const query = useSearchStore((s) => s.query);
  const results = useSearchStore((s) => s.results);
  const domain = useSearchStore((s) => s.domain);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const isSearching = useSearchStore((s) => s.isSearching);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setDomain = useSearchStore((s) => s.setDomain);
  const performSearch = useSearchStore((s) => s.performSearch);
  const loadHistory = useSearchStore((s) => s.loadHistory);
  const clearHistory = useSearchStore((s) => s.clearHistory);
  const clearResults = useSearchStore((s) => s.clearResults);

  // Data sources
  const exercises = useWorkoutStore((s) => s.exercises);
  const articles = useNewsStore((s) => s.articles);
  const savedArticles = useNewsStore((s) => s.savedArticles);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadHistory();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchData: UniversalSearchInput = {
    exercises: exercises.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment,
    })),
    foods: DEFAULT_FOODS.map((f) => ({
      name: f.name,
      protein: f.protein,
      category: f.category,
      calories: f.calories,
    })),
    articles: [...articles, ...savedArticles].map((a) => ({
      id: a.id,
      title: a.title,
      source: a.source,
      category: a.category,
      summary: a.summary,
    })),
    products: [], // No products yet
  };

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      clearResults();
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchData);
    }, DEBOUNCE_MS);
  }, [searchData]);

  const handleDomainChange = useCallback((d: SearchDomain) => {
    setDomain(d);
    if (query.trim()) {
      // Re-search immediately
      setTimeout(() => performSearch(searchData), 50);
    }
  }, [query, searchData]);

  const handleRecentPress = useCallback((q: string) => {
    setQuery(q);
    setTimeout(() => performSearch(searchData), 50);
  }, [searchData]);

  const handleResultPress = useCallback((result: SearchResult) => {
    emitEvent('SEARCH_RESULT_OPENED' as any, { id: result.id, domain: result.domain, title: result.title });

    if (result.domain === 'exercises' && onViewExercise) {
      onViewExercise(result.id);
    } else if (result.domain === 'articles') {
      const article = result.data as any;
      if (article?.link) Linking.openURL(article.link).catch(() => {});
    }
  }, [onViewExercise]);

  const domains: SearchDomain[] = ['all', 'exercises', 'foods', 'articles', 'products'];

  const domainColors: Record<string, string> = {
    exercises: COLORS.primary,
    foods: COLORS.accent,
    articles: COLORS.warning,
    products: COLORS.info,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search exercises, foods, articles..."
          placeholderTextColor={COLORS.textPlaceholder}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => { setQuery(''); clearResults(); }}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Domain Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={domains}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.domainRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.domainTab, domain === item && styles.domainTabActive]}
            onPress={() => handleDomainChange(item)}
          >
            <Text style={[styles.domainText, domain === item && styles.domainTextActive]}>
              {DOMAIN_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results or Recent */}
      {query.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.id}_${idx}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </Text>
          }
          ListEmptyComponent={
            !isSearching ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => handleResultPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.resultDot, { backgroundColor: domainColors[item.domain] ?? COLORS.textMuted }]} />
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                )}
              </View>
              <Text style={styles.resultDomain}>{item.domain}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.recentSection}>
          {recentSearches.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((q, idx) => (
                <TouchableOpacity
                  key={`recent_${idx}`}
                  style={styles.recentItem}
                  onPress={() => handleRecentPress(q)}
                >
                  <Text style={styles.recentIcon}>↻</Text>
                  <Text style={styles.recentText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {recentSearches.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Start typing to search</Text>
              <Text style={styles.emptySubtext}>Search across exercises, foods, and articles</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, marginBottom: SPACING.md,
  },
  backBtn: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: COLORS.text, ...TYPOGRAPHY.body,
  },
  clearBtn: { position: 'absolute', right: SPACING.md, padding: SPACING.xs },
  clearBtnText: { color: COLORS.textMuted, fontSize: 16 },
  domainRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  domainTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  domainTabActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  domainText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  domainTextActive: { color: COLORS.primary, fontWeight: '600' },
  resultsList: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md,
  },
  resultCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  resultDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
  resultContent: { flex: 1 },
  resultTitle: { ...TYPOGRAPHY.caption, color: COLORS.text },
  resultSubtitle: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: 2 },
  resultDomain: { ...TYPOGRAPHY.small, color: COLORS.textMuted, textTransform: 'capitalize' },
  recentSection: { paddingHorizontal: SPACING.lg },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  clearHistoryText: { ...TYPOGRAPHY.small, color: COLORS.error },
  recentItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  recentIcon: { color: COLORS.textMuted, marginRight: SPACING.sm, fontSize: 14 },
  recentText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  emptySubtext: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: SPACING.xs },
});
