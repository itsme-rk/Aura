// ─── ProductVaultScreen ───────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useProductStore } from '../../../store/productStore';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import {
  ProductItem, ProductCategory,
  PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_COLORS,
} from '../../../types';

interface Props {
  onAddProduct: () => void;
  onViewProduct: (product: ProductItem) => void;
}

export function ProductVaultScreen({ onAddProduct, onViewProduct }: Props) {
  const { user } = useAuth();
  const activeProducts = useProductStore((s) => s.activeProducts);
  const filterCategory = useProductStore((s) => s.filterCategory);
  const isLoading = useProductStore((s) => s.isLoading);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const setFilterCategory = useProductStore((s) => s.setFilterCategory);
  const markFinished = useProductStore((s) => s.markFinished);

  useEffect(() => {
    if (user?.uid) fetchProducts(user.uid);
  }, [user?.uid]);

  const filtered = filterCategory === 'all'
    ? activeProducts
    : activeProducts.filter((p) => p.category === filterCategory);

  const totalSpending = activeProducts.reduce((s, p) => s + (p.price ?? 0), 0);

  const categories: (ProductCategory | 'all')[] = [
    'all', 'supplement', 'whey_protein', 'skincare', 'shampoo', 'grooming', 'vitamins',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Product Vault</Text>
              <TouchableOpacity style={styles.addBtn} onPress={onAddProduct}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {/* Spending Summary */}
            <View style={styles.spendingCard}>
              <Text style={styles.spendingLabel}>Active Products</Text>
              <View style={styles.spendingRow}>
                <Text style={styles.spendingValue}>{activeProducts.length}</Text>
                {totalSpending > 0 && (
                  <Text style={styles.spendingTotal}>₹{totalSpending.toLocaleString()} total</Text>
                )}
              </View>
            </View>

            {/* Category Filter */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.catRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catTab, filterCategory === item && styles.catTabActive]}
                  onPress={() => setFilterCategory(item)}
                >
                  <Text style={[styles.catText, filterCategory === item && styles.catTextActive]}>
                    {item === 'all' ? '📦 All' : PRODUCT_CATEGORY_LABELS[item]}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        }
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => onViewProduct(item)}
            activeOpacity={0.7}
          >
            <View style={styles.productHeader}>
              <View style={[styles.catBadge, { backgroundColor: PRODUCT_CATEGORY_COLORS[item.category] + '22' }]}>
                <Text style={[styles.catBadgeText, { color: PRODUCT_CATEGORY_COLORS[item.category] }]}>
                  {item.category.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
            </View>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.productMeta}>
              {item.price != null && <Text style={styles.metaText}>₹{item.price}</Text>}
              <Text style={styles.metaText}>{item.usageFrequency}</Text>
              {item.quantity > 0 && <Text style={styles.metaText}>Qty: {item.quantity}</Text>}
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity onPress={() => markFinished(item.id)}>
                <Text style={styles.finishBtn}>✓ Finished</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading products...' : 'No products yet'}
            </Text>
            <Text style={styles.emptySubtext}>Add your supplements and daily products</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SPACING.md, marginBottom: SPACING.md,
  },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text },
  addBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, backgroundColor: COLORS.primary,
  },
  addBtnText: { ...TYPOGRAPHY.captionBold, color: COLORS.white },
  spendingCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  spendingLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  spendingRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.md, marginTop: SPACING.xs },
  spendingValue: { ...TYPOGRAPHY.h2, color: COLORS.primary },
  spendingTotal: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  catRow: { paddingBottom: SPACING.lg, gap: SPACING.sm },
  catTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  catTabActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  catText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  catTextActive: { color: COLORS.primary, fontWeight: '600' },
  productCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  productBrand: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  productName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: SPACING.xs },
  productMeta: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.sm },
  metaText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  productActions: { flexDirection: 'row' },
  finishBtn: { ...TYPOGRAPHY.small, color: COLORS.success },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  emptySubtext: { ...TYPOGRAPHY.small, color: COLORS.textMuted, marginTop: SPACING.xs },
});
