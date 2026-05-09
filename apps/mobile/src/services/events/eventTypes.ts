// ─── Event Types ──────────────────────────────────────────
//
// Internal pub/sub event system for cross-feature communication.
//

export type AuraEventType =
  | 'AUTH_STATE_CHANGED'
  | 'WORKOUT_LOGGED'
  | 'WORKOUT_COMPLETED'
  | 'WORKOUT_PLAN_UPDATED'
  | 'NUTRITION_LOGGED'
  | 'PRODUCT_SCANNED'
  | 'NEWS_FETCHED'
  | 'INSIGHT_GENERATED'
  | 'OFFLINE_SYNC_COMPLETED'
  | 'OFFLINE_QUEUE_UPDATED';

export interface AuraEvent<T = unknown> {
  type: AuraEventType;
  payload: T;
  timestamp: number;
}

export type AuraEventHandler<T = unknown> = (event: AuraEvent<T>) => void;
