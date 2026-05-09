// ─── Firestore Service ────────────────────────────────────
//
// Generic, strongly-typed CRUD helpers for Firestore.
// All functions use the modular SDK with async/await.
//

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  serverTimestamp,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Core CRUD ────────────────────────────────────────────

/**
 * Create a new document. Auto-generates ID if none provided.
 */
export async function createDocument<T extends DocumentData>(
  collectionPath: string,
  data: T,
  id?: string,
): Promise<string> {
  const ref: DocumentReference = id
    ? doc(db, collectionPath, id)
    : doc(collection(db, collectionPath));

  await setDoc(ref, {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return ref.id;
}

/**
 * Get a single document by ID.
 */
export async function getDocument<T>(
  collectionPath: string,
  docId: string,
): Promise<T | null> {
  const ref: DocumentReference = doc(db, collectionPath, docId);
  const snap: DocumentSnapshot = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() } as T;
}

/**
 * Update fields on an existing document.
 */
export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Partial<DocumentData>,
): Promise<void> {
  const ref: DocumentReference = doc(db, collectionPath, docId);
  await updateDoc(ref, {
    ...data,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(
  collectionPath: string,
  docId: string,
): Promise<void> {
  const ref: DocumentReference = doc(db, collectionPath, docId);
  await deleteDoc(ref);
}

// ─── Query Helpers ────────────────────────────────────────

export interface QueryOptions {
  /** Firestore where clauses */
  filters?: Array<{
    field: string;
    op: WhereFilterOp;
    value: unknown;
  }>;
  /** Order by field */
  sortBy?: string;
  /** Order direction */
  sortDirection?: OrderByDirection;
  /** Max results */
  limitTo?: number;
  /** Pagination cursor — last document snapshot */
  startAfterDoc?: unknown;
}

/**
 * Query documents with filters, sorting, and pagination.
 */
export async function queryDocuments<T>(
  collectionPath: string,
  options: QueryOptions = {},
): Promise<T[]> {
  const constraints: QueryConstraint[] = [];

  // Filters
  if (options.filters) {
    for (const f of options.filters) {
      constraints.push(where(f.field, f.op, f.value));
    }
  }

  // Sorting
  if (options.sortBy) {
    constraints.push(orderBy(options.sortBy, options.sortDirection ?? 'desc'));
  }

  // Pagination
  if (options.startAfterDoc) {
    constraints.push(startAfter(options.startAfterDoc));
  }

  // Limit
  if (options.limitTo) {
    constraints.push(limit(options.limitTo));
  }

  const q = query(collection(db, collectionPath), ...constraints);
  const snapshot: QuerySnapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/**
 * Get all documents for a user (common pattern).
 */
export async function getUserDocuments<T>(
  collectionPath: string,
  userId: string,
  options: Omit<QueryOptions, 'filters'> = {},
): Promise<T[]> {
  return queryDocuments<T>(collectionPath, {
    ...options,
    filters: [{ field: 'userId', op: '==', value: userId }],
  });
}
