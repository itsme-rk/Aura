// ─── ErrorBanner Component ────────────────────────────────
//
// Inline error display for auth screens.
//

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING, AUTH_RADIUS, AUTH_TYPOGRAPHY } from '../theme';

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AUTH_COLORS.errorBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
    borderRadius: AUTH_RADIUS.md,
    padding: AUTH_SPACING.md,
    marginBottom: AUTH_SPACING.md,
  },
  text: {
    ...AUTH_TYPOGRAPHY.caption,
    color: AUTH_COLORS.error,
    flex: 1,
    marginRight: AUTH_SPACING.sm,
  },
  dismiss: {
    ...AUTH_TYPOGRAPHY.body,
    color: AUTH_COLORS.error,
  },
});
