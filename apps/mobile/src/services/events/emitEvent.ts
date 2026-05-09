// ─── Event Emitter ────────────────────────────────────────
//
// Lightweight pub/sub bus for cross-feature communication.
//

import { AuraEvent, AuraEventType, AuraEventHandler } from './eventTypes';

type ListenerMap = Map<AuraEventType, Set<AuraEventHandler>>;

const listeners: ListenerMap = new Map();

/**
 * Subscribe to an event type.
 * Returns an unsubscribe function.
 */
export function onEvent<T = unknown>(
  type: AuraEventType,
  handler: AuraEventHandler<T>,
): () => void {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }

  const handlers = listeners.get(type)!;
  handlers.add(handler as AuraEventHandler);

  return () => {
    handlers.delete(handler as AuraEventHandler);
    if (handlers.size === 0) listeners.delete(type);
  };
}

/**
 * Emit an event to all subscribers.
 */
export function emitEvent<T = unknown>(
  type: AuraEventType,
  payload: T,
): void {
  const event: AuraEvent<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };

  const handlers = listeners.get(type);
  if (handlers) {
    handlers.forEach((handler) => handler(event as AuraEvent));
  }
}

/**
 * Remove all listeners (for cleanup/testing).
 */
export function clearAllListeners(): void {
  listeners.clear();
}
