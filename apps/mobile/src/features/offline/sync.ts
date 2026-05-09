// ─── Offline Sync ─────────────────────────────────────────
//
// Process queued operations when connectivity returns.
//

import { getQueue, dequeue, markRetry, QueuedOperation } from './queue';
import { setLastSyncTime } from './storage';
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../services/firestore.service';
import { emitEvent } from '../../services/events/emitEvent';

const MAX_RETRIES = 3;

/**
 * Process all queued offline operations.
 * Returns count of successfully synced operations.
 */
export async function syncOfflineQueue(): Promise<number> {
  const queue = await getQueue();
  let synced = 0;

  for (const op of queue) {
    if (op.retryCount >= MAX_RETRIES) {
      // Too many retries — remove from queue
      await dequeue(op.id);
      continue;
    }

    try {
      await processOperation(op);
      await dequeue(op.id);
      synced++;
    } catch (error) {
      await markRetry(op.id);
      console.warn(`[Sync] Failed operation ${op.id}:`, error);
    }
  }

  if (synced > 0) {
    await setLastSyncTime();
    emitEvent('OFFLINE_SYNC_COMPLETED', { synced, total: queue.length });
  }

  return synced;
}

/**
 * Execute a single queued operation against Firestore.
 */
async function processOperation(op: QueuedOperation): Promise<void> {
  switch (op.type) {
    case 'create':
      if (!op.data) throw new Error('Create operation requires data');
      await createDocument(op.collection, op.data, op.docId);
      break;

    case 'update':
      if (!op.docId || !op.data) throw new Error('Update requires docId and data');
      await updateDocument(op.collection, op.docId, op.data);
      break;

    case 'delete':
      if (!op.docId) throw new Error('Delete requires docId');
      await deleteDocument(op.collection, op.docId);
      break;
  }
}
