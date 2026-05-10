// ─── FoodSearchScreen ─────────────────────────────────────
//
// Searchable food database. Users can search the built-in
// food library, see results by category, and quick-add items.
//

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNutritionStore } from '../../../store/nutritionStore';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { FoodCategory, FOOD_CATEGORY_LABELS, MealType } from '../../../types';
import {
  DEFAULT_FOODS,
  DefaultFood,
  searchDefaultFoods,
  getDefaultCategories,
} from '../data/foodLibrary';
import { getTodayDateString } from '../services/nutrition.service';

interface FoodSearchScreenProps {
  onComplete: () => void;
}

export function FoodSearchScreen({ onComplete }: FoodSearchScreenProps) {
  const { user } = useAuth();
  const logFood = useNutritionStore((s) => s.logFood);
  const foodLibrary = useNutritionStore((s) => s.foodLibrary);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);

  const categories = useMemo(() => getDefaultCategories(), []);

  const filteredFoods = useMemo(() => {
    let results = searchQuery
      ? searchDefaultFoods(searchQuery)
      : DEFAULT_FOODS;

    if (selectedCategory !== 'all') {
      results = results.filter((f) => f.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory]);

  // Merge user's custom foods from library
  const userFoods = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return foodLibrary.filter((f) => f.name.toLowerCase().includes(q));
  }, [searchQuery, foodLibrary]);

  const handleAddFood = useCallback(async (food: DefaultFood) => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await logFood({
        userId: user.uid,
        foodName: food.name,
        protein: food.protein,
        calories: food.calories,
        quantity: 1,
        unit: food.servingUnit,
        date: getTodayDateString(),
        timestamp: Date.now(),
      });
      Alert.alert('Added', `${food.name} logged!`, [
        { text: 'Add More', style: 'default' },
        { text: 'Done', onPress: onComplete },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, logFood, onComplete]);

  const handleAddCustomFood = useCallback(async (food: typeof foodLibrary[0]) => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await logFood({
        userId: user.uid,
        foodName: food.name,
        protein: food.protein,
        calories: food.calories,
        quantity: 1,
        unit: food.servingUnit,
        date: getTodayDateString(),
        timestamp: Date.now(),
        foodLibraryId: food.id,
      });
      Alert.alert('Added', `${food.name} logged!`, [
        { text: 'Add More', style: 'default' },
        { text: 'Done', onPress: onComplete },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, logFood, onComplete]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search Food</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search foods..."
          placeholderTextColor={COLORS.textPlaceholder}
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['all', ...categories] as (FoodCategory | 'all')[]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive,
              ]}
            >
              {item === 'all' ? '🍽️ All' : FOOD_CATEGORY_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* User's Custom Foods */}
      {userFoods.length > 0 && (
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Your Foods</Text>
          {userFoods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodCard}
              onPress={() => handleAddCustomFood(food)}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodMeta}>
                  {food.servingSize}{food.servingUnit}
                  {food.calories ? ` · ${food.calories} kcal` : ''}
                </Text>
              </View>
              <View style={styles.foodProtein}>
                <Text style={styles.foodProteinValue}>{food.protein}g</Text>
                <Text style={styles.foodProteinLabel}>protein</Text>
              </View>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Default Food Results */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item, idx) => `${item.name}_${idx}`}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Results' : 'All Foods'} ({filteredFoods.length})
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No foods found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.foodCard}
            onPress={() => handleAddFood(item)}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodMeta}>
                {FOOD_CATEGORY_LABELS[item.category]?.split(' ')[0]}{' '}
                {item.calories ? ` · ${item.calories} kcal` : ''}
              </Text>
            </View>
            <View style={styles.foodProtein}>
              <Text style={styles.foodProteinValue}>{item.protein}g</Text>
              <Text style={styles.foodProteinLabel}>protein</Text>
            </View>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  backBtn: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 60,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  },
  clearBtn: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
  },
  clearBtnText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },

  // Categories
  categoryList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  categoryText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Custom Section
  customSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Section Title
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  // Results
  resultsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Food Cards
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  foodMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  foodProtein: {
    alignItems: 'flex-end',
    marginRight: SPACING.md,
  },
  foodProteinValue: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  foodProteinLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  addIcon: {
    ...TYPOGRAPHY.h3,
    color: COLORS.success,
    width: 28,
    textAlign: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  emptySubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
