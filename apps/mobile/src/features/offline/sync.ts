// ─── Offline Sync Engine (Hardened) ───────────────────────
//
// Production-grade sync engine with:
//   - Batch processing
//   - Retry throttling (exponential backoff)
//   - Duplicate prevention during sync
//   - Timestamp-based conflict resolution
//   - Event lifecycle (SYNC_STARTED → COMPLETED/FAILED)
//   - Sync lock to prevent concurrent syncs
//

import {
  getQueue,
  getPendingQueue,
  dequeue,
  markRetry,
  updateStatus,
  pruneQueue,
  QueuedOperation,
  SyncStatus,
} from './queue';
import { setLastSyncTime } from './storage';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
} from '../../services/firestore.service';
import { emitEvent } from '../../services/events/emitEvent';
import { syncLogger as log } from '../../services/logger/logger';

// ─── Config ───────────────────────────────────────────────

const MAX_RETRIES = 5;
const BATCH_SIZE = 10;
const MIN_RETRY_DELAY_MS = 2000;    // 2s base
const MAX_RETRY_DELAY_MS = 60000;   // 60s cap
const THROTTLE_INTERVAL_MS = 30000; // Minimum 30s between full syncs

// ─── Sync Lock ────────────────────────────────────────────

let _isSyncing = false;
let _lastSyncAttempt = 0;

export function isSyncInProgress(): boolean {
  return _isSyncing;
}

// ─── Retry Delay (Exponential Backoff) ────────────────────

function getRetryDelay(retryCount: number): number {
  const delay = MIN_RETRY_DELAY_MS * Math.pow(2, retryCount);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

/** Check if an operation is eligible for retry (throttled). */
function isRetryReady(op: QueuedOperation): boolean {
  if (op.syncStatus === 'pending') return true;
  if (op.syncStatus !== 'failed') return false;
  if (op.retryCount >= MAX_RETRIES) return false;

  const delay = getRetryDelay(op.retryCount);
  const elapsed = Date.now() - (op.lastAttemptAt ?? 0);
  return elapsed >= delay;
}

// ─── Deduplication Check ──────────────────────────────────

/**
 * Check if a create operation already exists in Firestore.
 * Prevents duplicate workout/nutrition logs after offline sync.
 */
async function isDuplicateInFirestore(op: QueuedOperation): Promise<boolean> {
  if (op.type !== 'create' || !op.data) return false;

  const userId = op.data.userId as string;
  if (!userId) return false;

  // For workout logs — check if same startedAt exists
  if (op.collection === 'workoutLogs' && op.data.startedAt) {
    try {
      const existing = await queryDocuments(op.collection, {
        filters: [
          { field: 'userId', op: '==', value: userId },
          { field: 'startedAt', op: '==', value: op.data.startedAt },
        ],
        limitTo: 1,
      });
      return existing.length > 0;
    } catch {
      return false; // If check fails, try to sync anyway
    }
  }

  // For nutrition logs — check if same food + timestamp exists
  if (op.collection === 'nutritionLogs' && op.data.timestamp) {
    try {
      const existing = await queryDocuments(op.collection, {
        filters: [
          { field: 'userId', op: '==', value: userId },
          { field: 'timestamp', op: '==', value: op.data.timestamp },
        ],
        limitTo: 1,
      });
      return existing.length > 0;
    } catch {
      return false;
    }
  }

  return false;
}

// ─── Process Single Operation ─────────────────────────────

async function processOperation(op: QueuedOperation): Promise<void> {
  // Merge data and payload for backward compatibility
  const data = op.data ?? op.payload;

  switch (op.type) {
    case 'create':
      if (!data) throw new Error('Create operation requires data');

      // Check for duplicates before creating
      const duplicate = await isDuplicateInFirestore(op);
      if (duplicate) {
        log.info(`Skipped duplicate create: ${op.collection}`, { dedupKey: op.dedupKey });
        return; // Silently skip — operation already exists
      }

      await createDocument(op.collection, data, op.docId);
      break;

    case 'update':
      if (!op.docId || !data) throw new Error('Update requires docId and data');

      // Timestamp-based conflict resolution:
      // Only update if our data is newer
      if (data.updatedAt) {
        try {
          const existing = await queryDocuments(op.collection, {
            filters: [{ field: '__name__', op: '==', value: op.docId }],
            limitTo: 1,
          });
          if (existing.length > 0) {
            const existingUpdatedAt = (existing[0] as any).updatedAt ?? 0;
            if (existingUpdatedAt > (data.updatedAt as number)) {
              log.info(`Skipped stale update: ${op.collection}/${op.docId}`);
              return; // Server has newer data
            }
          }
        } catch {
          // If conflict check fails, proceed with update
        }
      }

      await updateDocument(op.collection, op.docId, data);
      break;

    case 'delete':
      if (!op.docId) throw new Error('Delete requires docId');
      await deleteDocument(op.collection, op.docId);
      break;
  }
}

// ─── Main Sync Engine ─────────────────────────────────────

/**
 * Process all pending offline operations in batches.
 * Returns count of successfully synced operations.
 *
 * Features:
 *   - Sync lock prevents concurrent runs
 *   - Throttle prevents sync spam
 *   - Batch processing for large queues
 *   - Exponential backoff for failed ops
 *   - Deduplication before Firestore writes
 *   - Event lifecycle emission
 */
export async function syncOfflineQueue(): Promise<number> {
  // Prevent concurrent syncs
  if (_isSyncing) {
    log.warn('Sync already in progress — skipping');
    return 0;
  }

  // Throttle: don't sync too frequently
  const now = Date.now();
  if (now - _lastSyncAttempt < THROTTLE_INTERVAL_MS) {
    log.info('Sync throttled — too soon since last attempt');
    return 0;
  }

  _isSyncing = true;
  _lastSyncAttempt = now;
  let totalSynced = 0;

  try {
    emitEvent('SYNC_STARTED', { timestamp: now });

    const pending = await getPendingQueue();
    if (pending.length === 0) {
      log.info('No pending operations to sync');
      _isSyncing = false;
      return 0;
    }

    log.info(`Starting sync: ${pending.length} operations`);

    // Filter to retry-ready operations
    const eligible = pending.filter(isRetryReady);
    if (eligible.length === 0) {
      log.info('No eligible operations (all throttled by backoff)');
      _isSyncing = false;
      return 0;
    }

    // Process in batches
    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const batch = eligible.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (op) => {
          // Mark as syncing
          await updateStatus(op.id, 'syncing');

          try {
            await processOperation(op);
            await dequeue(op.id); // Remove on success
            return true;
          } catch (error: any) {
            const errMsg = error?.message ?? 'Unknown error';

            if (op.retryCount + 1 >= MAX_RETRIES) {
              log.error(`Operation permanently failed after ${MAX_RETRIES} retries: ${op.id}`, { error: errMsg });
              await updateStatus(op.id, 'failed', `Permanently failed: ${errMsg}`);
            } else {
              log.warn(`Operation failed (retry ${op.retryCount + 1}): ${op.id}`, { error: errMsg });
              await markRetry(op.id, errMsg);
            }
            return false;
          }
        }),
      );

      const batchSynced = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      ).length;
      totalSynced += batchSynced;
    }

    // Prune completed/permanently-failed from queue
    const pruned = await pruneQueue(MAX_RETRIES);
    if (pruned > 0) {
      log.info(`Pruned ${pruned} completed/failed operations`);
    }

    // Save sync timestamp
    if (totalSynced > 0) {
      await setLastSyncTime();
    }

    emitEvent('SYNC_COMPLETED', {
      synced: totalSynced,
      total: eligible.length,
      timestamp: Date.now(),
    });

    // Also emit legacy event for backward compatibility
    if (totalSynced > 0) {
      emitEvent('OFFLINE_SYNC_COMPLETED', { synced: totalSynced, total: eligible.length });
    }

    log.info(`Sync complete: ${totalSynced}/${eligible.length} operations synced`);
  } catch (error: any) {
    log.error('Sync engine error:', { error: error?.message });
    emitEvent('SYNC_FAILED', { error: error?.message, timestamp: Date.now() });
  } finally {
    _isSyncing = false;
  }

  return totalSynced;
}

/**
 * Force reset the sync lock (emergency recovery).
 */
export function resetSyncLock(): void {
  _isSyncing = false;
  _lastSyncAttempt = 0;
}
