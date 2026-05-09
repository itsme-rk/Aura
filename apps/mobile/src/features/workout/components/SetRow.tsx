// ─── SetRow Component ─────────────────────────────────────
//
// Single set row inside workout session.
// Editable reps, weight, warmup toggle, completion toggle.
//

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SetLog } from '../../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface SetRowProps {
  set: SetLog;
  onUpdate: (data: Partial<SetLog>) => void;
  onRemove: () => void;
}

export function SetRow({ set, onUpdate, onRemove }: SetRowProps) {
  return (
    <View style={[styles.container, set.isCompleted && styles.completed]}>
      {/* Set number */}
      <View style={styles.setNumber}>
        <Text style={[styles.setNumberText, set.isWarmup && styles.warmupText]}>
          {set.isWarmup ? 'W' : set.setNumber}
        </Text>
      </View>

      {/* Weight */}
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={set.weightKg > 0 ? String(set.weightKg) : ''}
          onChangeText={(v) => onUpdate({ weightKg: parseFloat(v) || 0 })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textPlaceholder}
          selectionColor={COLORS.primary}
        />
        <Text style={styles.unit}>kg</Text>
      </View>

      {/* Reps */}
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(v) => onUpdate({ reps: parseInt(v, 10) || 0 })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textPlaceholder}
          selectionColor={COLORS.primary}
        />
        <Text style={styles.unit}>reps</Text>
      </View>

      {/* Warmup toggle */}
      <TouchableOpacity
        onPress={() => onUpdate({ isWarmup: !set.isWarmup })}
        style={[styles.toggleBtn, set.isWarmup && styles.toggleActive]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={[styles.toggleText, set.isWarmup && styles.toggleTextActive]}>W</Text>
      </TouchableOpacity>

      {/* Complete toggle */}
      <TouchableOpacity
        onPress={() => onUpdate({ isCompleted: !set.isCompleted })}
        style={[styles.checkBtn, set.isCompleted && styles.checkBtnActive]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={styles.checkText}>{set.isCompleted ? '✓' : ''}</Text>
      </TouchableOpacity>

      {/* Remove */}
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 2,
  },
  completed: {
    backgroundColor: COLORS.successBg,
  },
  setNumber: {
    width: 28,
    alignItems: 'center',
  },
  setNumberText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
  },
  warmupText: {
    color: COLORS.warning,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 36,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
    height: '100%',
  },
  unit: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warning,
  },
  toggleText: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.warning,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  checkText: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.success,
  },
  removeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
});
