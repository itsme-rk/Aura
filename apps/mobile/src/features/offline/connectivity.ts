// ─── Connectivity Detection ───────────────────────────────
//
// Detects network connectivity changes and triggers sync.
// Uses a lightweight polling approach compatible with all
// React Native environments (no external dependency needed).
//

import { AppState, AppStateStatus, Platform } from 'react-native';
import { syncLogger as log } from '../../services/logger/logger';

// ─── Types ────────────────────────────────────────────────

export type ConnectivityStatus = 'online' | 'offline' | 'unknown';

type ConnectivityHandler = (isOnline: boolean) => void;

// ─── State ────────────────────────────────────────────────

let _currentStatus: ConnectivityStatus = 'unknown';
let _handlers: Set<ConnectivityHandler> = new Set();
let _pollInterval: ReturnType<typeof setInterval> | null = null;
let _appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

const POLL_INTERVAL_MS = 30000; // Check every 30 seconds
const CONNECTIVITY_CHECK_URL = 'https://clients3.google.com/generate_204';
const CONNECTIVITY_TIMEOUT_MS = 5000;

// ─── Connectivity Check ───────────────────────────────────

/**
 * Perform a lightweight connectivity check.
 * Uses a HEAD request to Google's 204 endpoint.
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);

    const response = await fetch(CONNECTIVITY_CHECK_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

// ─── Status Management ────────────────────────────────────

function updateStatus(isOnline: boolean): void {
  const newStatus: ConnectivityStatus = isOnline ? 'online' : 'offline';

  if (newStatus !== _currentStatus) {
    const wasOffline = _currentStatus === 'offline';
    _currentStatus = newStatus;

    log.info(`Connectivity changed: ${newStatus}`);

    // Notify all handlers
    _handlers.forEach((handler) => {
      try {
        handler(isOnline);
      } catch (err) {
        log.error('Connectivity handler error', err);
      }
    });
  }
}

// ─── Subscription ─────────────────────────────────────────

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(handler: ConnectivityHandler): () => void {
  _handlers.add(handler);
  return () => {
    _handlers.delete(handler);
  };
}

/**
 * Get current connectivity status.
 */
export function getConnectivityStatus(): ConnectivityStatus {
  return _currentStatus;
}

/**
 * Check if currently online.
 */
export function isOnline(): boolean {
  return _currentStatus === 'online';
}

// ─── Lifecycle ────────────────────────────────────────────

/**
 * Start connectivity monitoring.
 * - Runs an initial check
 * - Polls periodically
 * - Checks on app foreground resume
 */
export async function startConnectivityMonitor(): Promise<void> {
  // Initial check
  const online = await checkConnectivity();
  updateStatus(online);

  // Periodic polling
  if (_pollInterval) clearInterval(_pollInterval);
  _pollInterval = setInterval(async () => {
    const online = await checkConnectivity();
    updateStatus(online);
  }, POLL_INTERVAL_MS);

  // Check on app resume (foreground)
  if (_appStateSubscription) {
    _appStateSubscription.remove();
  }

  _appStateSubscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
    if (state === 'active') {
      log.debug('App resumed — checking connectivity');
      const online = await checkConnectivity();
      updateStatus(online);
    }
  });

  log.info('Connectivity monitor started');
}

/**
 * Stop connectivity monitoring.
 */
export function stopConnectivityMonitor(): void {
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }

  if (_appStateSubscription) {
    _appStateSubscription.remove();
    _appStateSubscription = null;
  }

  _handlers.clear();
  log.info('Connectivity monitor stopped');
}
