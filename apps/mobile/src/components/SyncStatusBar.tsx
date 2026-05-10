// ─── SyncStatusBar ────────────────────────────────────────
//
// Lightweight inline indicator showing offline/syncing/pending
// status at the top of the screen. Minimal and non-intrusive.
//

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOfflineStore } from '../../store/offlineStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

export function SyncStatusBar() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const queueSize = useOfflineStore((s) => s.queueSize);
  const syncProgress = useOfflineStore((s) => s.syncProgress);
  const syncNow = useOfflineStore((s) => s.syncNow);

  // Don't show if everything is fine
  if (isOnline && !isSyncing && queueSize === 0) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isOnline && styles.offline,
        isSyncing && styles.syncing,
        isOnline && !isSyncing && queueSize > 0 && styles.pending,
      ]}
      onPress={() => {
        if (isOnline && queueSize > 0 && !isSyncing) {
          syncNow();
        }
      }}
      activeOpacity={0.8}
    >
      {isSyncing && (
        <ActivityIndicator size="small" color={COLORS.info} style={styles.spinner} />
      )}

      <Text style={styles.text}>
        {!isOnline && '📡 Offline mode — changes will sync when connected'}
        {isOnline && isSyncing && `⟳ Syncing${syncProgress ? ` (${syncProgress})` : '...'}`}
        {isOnline && !isSyncing && queueSize > 0 && `⏳ ${queueSize} pending — tap to sync`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  offline: {
    backgroundColor: COLORS.warning + '22',
  },
  syncing: {
    backgroundColor: COLORS.info + '18',
  },
  pending: {
    backgroundColor: COLORS.primary + '18',
  },
  spinner: {
    marginRight: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
