// ─── Offline Storage ──────────────────────────────────────
//
// AsyncStorage helpers for offline data persistence.
//

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  OFFLINE_QUEUE: '@aura/offline_queue',
  LAST_SYNC: '@aura/last_sync',
} as const;

/**
 * Save data to AsyncStorage (JSON serialized).
 */
export async function saveOfflineData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load data from AsyncStorage.
 */
export async function loadOfflineData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

/**
 * Remove a key from AsyncStorage.
 */
export async function removeOfflineData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * Get last sync timestamp.
 */
export async function getLastSyncTime(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEYS.LAST_SYNC);
  return raw ? parseInt(raw, 10) : null;
}

/**
 * Update last sync timestamp.
 */
export async function setLastSyncTime(time: number = Date.now()): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, time.toString());
}

export { KEYS as OFFLINE_KEYS };
