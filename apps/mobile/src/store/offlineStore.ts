// ─── Offline Store ────────────────────────────────────────
//
// Offline connectivity and sync queue state management.
//

import { create } from 'zustand';
import { QueuedOperation, getQueue, getQueueSize } from '../features/offline/queue';
import { syncOfflineQueue } from '../features/offline/sync';
import { getLastSyncTime } from '../features/offline/storage';

// ─── State Interface ──────────────────────────────────────

interface OfflineState {
  // State
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  lastSyncAt: number | null;
  error: string | null;

  // Actions
  setOnline: (isOnline: boolean) => void;
  refreshQueueSize: () => Promise<void>;
  syncNow: () => Promise<number>;
  loadLastSync: () => Promise<void>;
}

// ─── Selectors ────────────────────────────────────────────

export const selectIsOnline = (state: OfflineState) => state.isOnline;
export const selectIsSyncing = (state: OfflineState) => state.isSyncing;
export const selectQueueSize = (state: OfflineState) => state.queueSize;
export const selectHasPendingSync = (state: OfflineState) => state.queueSize > 0;

// ─── Store ────────────────────────────────────────────────

export const useOfflineStore = create<OfflineState>()((set, get) => ({
  isOnline: true,
  isSyncing: false,
  queueSize: 0,
  lastSyncAt: null,
  error: null,

  setOnline: (isOnline) => {
    set({ isOnline });

    // Auto-sync when coming back online
    if (isOnline && get().queueSize > 0) {
      get().syncNow();
    }
  },

  refreshQueueSize: async () => {
    const size = await getQueueSize();
    set({ queueSize: size });
  },

  syncNow: async () => {
    const { isSyncing, isOnline } = get();
    if (isSyncing || !isOnline) return 0;

    set({ isSyncing: true, error: null });
    try {
      const synced = await syncOfflineQueue();
      const size = await getQueueSize();
      set({ isSyncing: false, queueSize: size, lastSyncAt: Date.now() });
      return synced;
    } catch (err: any) {
      set({ isSyncing: false, error: err.message });
      return 0;
    }
  },

  loadLastSync: async () => {
    const lastSyncAt = await getLastSyncTime();
    set({ lastSyncAt });
  },
}));
