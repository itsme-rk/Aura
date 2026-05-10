// ─── Offline Feature Barrel ───────────────────────────────

export {
  enqueue,
  dequeue,
  getQueue,
  getPendingQueue,
  getQueueSize,
  getQueueStats,
  clearQueue,
  pruneQueue,
  updateStatus,
  markRetry,
  generateDedupKey,
} from './queue';
export type { QueuedOperation, SyncStatus } from './queue';

export { syncOfflineQueue, isSyncInProgress, resetSyncLock } from './sync';

export {
  startConnectivityMonitor,
  stopConnectivityMonitor,
  onConnectivityChange,
  checkConnectivity,
  isOnline,
  getConnectivityStatus,
} from './connectivity';
export type { ConnectivityStatus } from './connectivity';

export {
  saveOfflineData,
  loadOfflineData,
  removeOfflineData,
  getLastSyncTime,
  setLastSyncTime,
  OFFLINE_KEYS,
} from './storage';
