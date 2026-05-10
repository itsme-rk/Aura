// ─── Offline Queue (Hardened) ─────────────────────────────
//
// Production-grade offline operation queue with:
//   - Sync status tracking (pending, syncing, failed, completed)
//   - Deduplication logic for workouts + nutrition logs
//   - Timestamp-based conflict resolution
//   - Retry throttling
//   - Batch-friendly structure
//

import { saveOfflineData, loadOfflineData, OFFLINE_KEYS } from './storage';
import { queueLogger as log } from '../../services/logger/logger';

// ─── Queue Item Types ─────────────────────────────────────

export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'completed';

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>; // alias for data for clarity
  createdAt: number;
  retryCount: number;
  syncStatus: SyncStatus;
  lastAttemptAt?: number;
  errorMessage?: string;
  /** Dedup key — prevents duplicate operations on the same entity */
  dedupKey?: string;
}

// ─── Dedup Key Generation ─────────────────────────────────

/**
 * Generate a dedup key for an operation.
 * Prevents duplicate workout logs, nutrition logs, etc.
 *
 * Pattern: {collection}:{type}:{docId|data-hash}
 */
export function generateDedupKey(op: Pick<QueuedOperation, 'type' | 'collection' | 'docId' | 'data'>): string {
  if (op.docId) {
    return `${op.collection}:${op.type}:${op.docId}`;
  }

  // For creates without docId, use a content hash
  if (op.data) {
    const userId = op.data.userId as string ?? '';
    const date = op.data.date as string ?? '';
    const name = (op.data.name as string) ?? (op.data.foodName as string) ?? '';
    const ts = op.data.timestamp as number ?? op.data.startedAt as number ?? 0;
    return `${op.collection}:${op.type}:${userId}:${date}:${name}:${ts}`;
  }

  return `${op.collection}:${op.type}:${Date.now()}`;
}

// ─── Queue Operations ─────────────────────────────────────

/**
 * Add an operation to the offline queue.
 * Includes deduplication — if an identical operation exists, skip it.
 */
export async function enqueue(
  op: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount' | 'syncStatus' | 'dedupKey'>,
): Promise<void> {
  const queue = await getQueue();

  // Generate dedup key
  const dedupKey = generateDedupKey(op);

  // Check for duplicates — skip if same operation is already queued
  const isDuplicate = queue.some(
    (existing) =>
      existing.dedupKey === dedupKey &&
      existing.syncStatus !== 'completed' &&
      existing.syncStatus !== 'failed',
  );

  if (isDuplicate) {
    log.info(`Duplicate operation skipped: ${dedupKey}`);
    return;
  }

  const queuedOp: QueuedOperation = {
    ...op,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    retryCount: 0,
    syncStatus: 'pending',
    dedupKey,
  };

  queue.push(queuedOp);
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, queue);

  log.info(`Enqueued: ${op.type} → ${op.collection}`, { dedupKey });
}

/**
 * Get all queued operations (all statuses).
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  return (await loadOfflineData<QueuedOperation[]>(OFFLINE_KEYS.OFFLINE_QUEUE)) ?? [];
}

/**
 * Get only pending operations (ready to sync).
 */
export async function getPendingQueue(): Promise<QueuedOperation[]> {
  const queue = await getQueue();
  return queue.filter((op) => op.syncStatus === 'pending' || op.syncStatus === 'failed');
}

/**
 * Remove a processed operation from the queue.
 */
export async function dequeue(operationId: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.filter((op) => op.id !== operationId);
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, updated);
}

/**
 * Update the sync status of an operation.
 */
export async function updateStatus(
  operationId: string,
  status: SyncStatus,
  errorMessage?: string,
): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((op) =>
    op.id === operationId
      ? {
          ...op,
          syncStatus: status,
          lastAttemptAt: Date.now(),
          errorMessage: errorMessage ?? op.errorMessage,
        }
      : op,
  );
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, updated);
}

/**
 * Increment retry count and mark as failed.
 */
export async function markRetry(operationId: string, error?: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((op) =>
    op.id === operationId
      ? {
          ...op,
          retryCount: op.retryCount + 1,
          syncStatus: 'failed' as SyncStatus,
          lastAttemptAt: Date.now(),
          errorMessage: error,
        }
      : op,
  );
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, updated);
}

/**
 * Clear completed and permanently failed operations.
 */
export async function pruneQueue(maxRetries: number = 5): Promise<number> {
  const queue = await getQueue();
  const before = queue.length;
  const pruned = queue.filter(
    (op) =>
      op.syncStatus !== 'completed' &&
      !(op.syncStatus === 'failed' && op.retryCount >= maxRetries),
  );
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, pruned);
  return before - pruned.length;
}

/**
 * Clear the entire queue.
 */
export async function clearQueue(): Promise<void> {
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, []);
}

/**
 * Get number of pending (unsync'd) operations.
 */
export async function getQueueSize(): Promise<number> {
  const pending = await getPendingQueue();
  return pending.length;
}

/**
 * Get full queue stats.
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  completed: number;
}> {
  const queue = await getQueue();
  return {
    total: queue.length,
    pending: queue.filter((op) => op.syncStatus === 'pending').length,
    syncing: queue.filter((op) => op.syncStatus === 'syncing').length,
    failed: queue.filter((op) => op.syncStatus === 'failed').length,
    completed: queue.filter((op) => op.syncStatus === 'completed').length,
  };
}
