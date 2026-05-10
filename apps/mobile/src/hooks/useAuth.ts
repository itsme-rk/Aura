// ─── useAuth Hook ─────────────────────────────────────────
//
// Convenience hook wrapping the auth store.
// Initializes the Firebase auth listener on mount.
//

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store';

/**
 * Initialize auth and subscribe to Firebase auth state.
 * Call this ONCE at the app root level.
 */
export function useAuthInit() {
  const initialize = useAuthStore((s) => s.initialize);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubRef.current = initialize();
    return () => {
      unsubRef.current?.();
    };
  }, [initialize]);
}

/**
 * Convenience hook for consuming auth state.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    logout,
    clearError,
    updateUserProfile,
  };
}
