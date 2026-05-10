// ─── Offline Store (Hardened) ─────────────────────────────
//
// Production-grade offline state management.
// Manages connectivity, sync lifecycle, queue stats,
// and auto-sync on connectivity restoration.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQueue, getQueueSize, getQueueStats, pruneQueue, SyncStatus } from '../features/offline/queue';
import { syncOfflineQueue, isSyncInProgress, resetSyncLock } from '../features/offline/sync';
import { getLastSyncTime } from '../features/offline/storage';
import {
  startConnectivityMonitor,
  stopConnectivityMonitor,
  onConnectivityChange,
  checkConnectivity,
} from '../features/offline/connectivity';
import { syncLogger as log } from '../services/logger/logger';

// ─── State Interface ──────────────────────────────────────

interface OfflineState {
  // Connectivity
  isOnline: boolean;

  // Sync State
  isSyncing: boolean;
  syncProgress: string | null; // e.g. "3/10 synced"

  // Queue
  queueSize: number;
  pendingCount: number;
  failedCount: number;

  // Metadata
  lastSyncAt: number | null;
  error: string | null;

  // Actions
  initialize: () => () => void;
  setOnline: (isOnline: boolean) => void;
  refreshQueueStats: () => Promise<void>;
  syncNow: () => Promise<number>;
  forceSyncReset: () => void;
  loadLastSync: () => Promise<void>;
  pruneCompleted: () => Promise<void>;
}

// ─── Selectors ────────────────────────────────────────────

export const selectIsOnline = (state: OfflineState) => state.isOnline;
export const selectIsSyncing = (state: OfflineState) => state.isSyncing;
export const selectQueueSize = (state: OfflineState) => state.queueSize;
export const selectHasPendingSync = (state: OfflineState) => state.queueSize > 0;
export const selectSyncProgress = (state: OfflineState) => state.syncProgress;
export const selectFailedCount = (state: OfflineState) => state.failedCount;
export const selectLastSyncAt = (state: OfflineState) => state.lastSyncAt;
export const selectSyncStatus = (state: OfflineState): string => {
  if (!state.isOnline) return 'offline';
  if (state.isSyncing) return 'syncing';
  if (state.queueSize > 0) return 'pending';
  return 'synced';
};

// ─── Store ────────────────────────────────────────────────

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      isSyncing: false,
      syncProgress: null,
      queueSize: 0,
      pendingCount: 0,
      failedCount: 0,
      lastSyncAt: null,
      error: null,

      /**
       * Initialize connectivity monitor and auto-sync.
       * Call once at app mount. Returns cleanup function.
       */
      initialize: () => {
        // Start monitoring
        startConnectivityMonitor();

        // Subscribe to changes
        const unsubConnectivity = onConnectivityChange((isOnline) => {
          const prev = get().isOnline;
          set({ isOnline });

          // Auto-sync when coming back online
          if (isOnline && !prev) {
            log.info('Back online — triggering auto-sync');
            get().syncNow();
          }
        });

        // Initial queue check
        get().refreshQueueStats();
        get().loadLastSync();

        // Do an initial connectivity check
        checkConnectivity().then((online) => {
          set({ isOnline: online });
        });

        return () => {
          unsubConnectivity();
          stopConnectivityMonitor();
        };
      },

      setOnline: (isOnline) => {
        const prev = get().isOnline;
        set({ isOnline });

        if (isOnline && !prev && get().queueSize > 0) {
          get().syncNow();
        }
      },

      refreshQueueStats: async () => {
        try {
          const stats = await getQueueStats();
          set({
            queueSize: stats.pending + stats.failed,
            pendingCount: stats.pending,
            failedCount: stats.failed,
          });
        } catch {
          // Non-critical
        }
      },

      syncNow: async () => {
        const { isSyncing, isOnline } = get();
        if (isSyncing || !isOnline) return 0;

        set({ isSyncing: true, error: null, syncProgress: 'Starting...' });

        try {
          const synced = await syncOfflineQueue();
          await get().refreshQueueStats();
          const lastSyncAt = Date.now();

          set({
            isSyncing: false,
            lastSyncAt,
            syncProgress: synced > 0 ? `${synced} synced` : null,
          });

          // Clear progress message after 3 seconds
          if (synced > 0) {
            setTimeout(() => {
              set({ syncProgress: null });
            }, 3000);
          }

          return synced;
        } catch (err: any) {
          set({
            isSyncing: false,
            error: err.message,
            syncProgress: null,
          });
          return 0;
        }
      },

      /**
       * Emergency: force-reset the sync lock if stuck.
       */
      forceSyncReset: () => {
        resetSyncLock();
        set({ isSyncing: false, syncProgress: null, error: null });
        log.warn('Sync lock force-reset');
      },

      loadLastSync: async () => {
        const lastSyncAt = await getLastSyncTime();
        set({ lastSyncAt });
      },

      pruneCompleted: async () => {
        await pruneQueue(5);
        await get().refreshQueueStats();
      },
    }),
    {
      name: '@aura/offline',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);
