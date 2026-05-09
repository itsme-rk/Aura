// ─── Offline Queue ────────────────────────────────────────
//
// Queue operations while offline for later sync.
//

import { saveOfflineData, loadOfflineData, OFFLINE_KEYS } from './storage';

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/**
 * Add an operation to the offline queue.
 */
export async function enqueue(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const queue = await getQueue();
  const queuedOp: QueuedOperation = {
    ...op,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(queuedOp);
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, queue);
}

/**
 * Get all queued operations.
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  return (await loadOfflineData<QueuedOperation[]>(OFFLINE_KEYS.OFFLINE_QUEUE)) ?? [];
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
 * Increment retry count for a failed operation.
 */
export async function markRetry(operationId: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((op) =>
    op.id === operationId ? { ...op, retryCount: op.retryCount + 1 } : op,
  );
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, updated);
}

/**
 * Clear the entire queue.
 */
export async function clearQueue(): Promise<void> {
  await saveOfflineData(OFFLINE_KEYS.OFFLINE_QUEUE, []);
}

/**
 * Get number of pending operations.
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
