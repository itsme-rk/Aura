// ─── Shared Type Barrel ───────────────────────────────────

export * from './user';
export * from './workout';
export * from './nutrition';
export * from './product';
export * from './news';
export * from './event';
export * from './ai';

// ─── Common Utility Types ─────────────────────────────────

/** Firestore document with standard metadata */
export interface FirestoreDoc {
  id: string;
  createdAt: number;
  updatedAt?: number;
}

/** Standard async operation state */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

/** Pagination cursor for Firestore queries */
export interface PaginationState {
  lastDoc: unknown | null;
  hasMore: boolean;
  pageSize: number;
}
