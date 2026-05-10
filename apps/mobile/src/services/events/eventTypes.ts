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
  | 'PROTEIN_ADDED'
  | 'PROTEIN_GOAL_REACHED'
  | 'STREAK_UPDATED'
  | 'ACTIVITY_LOGGED'
  | 'PRODUCT_SCANNED'
  | 'NEWS_FETCHED'
  | 'INSIGHT_GENERATED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'OFFLINE_SYNC_COMPLETED'
  | 'OFFLINE_QUEUE_UPDATED'
  | 'REMINDER_TRIGGERED';

export interface AuraEvent<T = unknown> {
  type: AuraEventType;
  payload: T;
  timestamp: number;
}

export type AuraEventHandler<T = unknown> = (event: AuraEvent<T>) => void;
