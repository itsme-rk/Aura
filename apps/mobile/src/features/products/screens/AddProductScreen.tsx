// ─── AddProductScreen ─────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useProductStore } from '../../../store/productStore';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import {
  ProductCategory, UsageFrequency,
  PRODUCT_CATEGORY_LABELS,
} from '../../../types';

interface Props {
  onComplete: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'supplement', 'whey_protein', 'skincare', 'shampoo', 'grooming', 'vitamins', 'other',
];
const FREQUENCIES: UsageFrequency[] = ['daily', 'weekly', 'monthly', 'as_needed'];

export function AddProductScreen({ onComplete }: Props) {
  const { user } = useAuth();
  const addProduct = useProductStore((s) => s.addProduct);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('supplement');
  const [brand, setBrand] = useState('');
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [frequency, setFrequency] = useState<UsageFrequency>('daily');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !user?.uid) return;

    setSaving(true);
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await addProduct({
      userId: user.uid,
      name: name.trim(),
      category,
      brand: brand.trim() || undefined,
      store: store.trim() || undefined,
      purchaseDate: dateStr,
      quantity: parseInt(quantity) || 1,
      price: price ? parseFloat(price) : undefined,
      usageFrequency: frequency,
      notes: notes.trim() || undefined,
    });

    setSaving(false);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.backBtn}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Product</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          <Text style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}>
            {saving ? '...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Whey Protein Isolate"
          placeholderTextColor={COLORS.textPlaceholder}
          autoFocus
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {PRODUCT_CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Brand + Store */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Brand name"
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Store</Text>
            <TextInput
              style={styles.input}
              value={store}
              onChangeText={setStore}
              placeholder="Where bought"
              placeholderTextColor={COLORS.textPlaceholder}
            />
          </View>
        </View>

        {/* Price + Quantity */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Frequency */}
        <Text style={styles.label}>Usage Frequency</Text>
        <View style={styles.chipRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, frequency === f && styles.chipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                {f.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          placeholderTextColor={COLORS.textPlaceholder}
          multiline
          numberOfLines={3}
        />
      </ScrollView>
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
  title: { ...TYPOGRAPHY.h3, color: COLORS.text },
  saveBtn: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },
  saveBtnDisabled: { opacity: 0.3 },
  form: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  label: {
    ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary,
    marginBottom: SPACING.xs, marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: COLORS.text, ...TYPOGRAPHY.body,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: SPACING.sm },
  halfField: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  chipText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: '600' },
});
