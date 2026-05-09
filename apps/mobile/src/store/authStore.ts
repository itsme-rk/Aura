// ─── Auth Store ───────────────────────────────────────────
//
// Authentication state management with Firebase integration.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as FirebaseUser } from 'firebase/auth';
import { User, DEFAULT_USER_PREFERENCES } from '../types';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
} from '../services/auth.service';
import {
  createDocument,
  getDocument,
  updateDocument,
} from '../services/firestore.service';
import { emitEvent } from '../services/events/emitEvent';

// ─── State Interface ──────────────────────────────────────

interface AuthState {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

// ─── Selectors ────────────────────────────────────────────

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAuthLoading = (state: AuthState) => state.isLoading;
export const selectAuthError = (state: AuthState) => state.error;
export const selectUserId = (state: AuthState) => state.user?.uid ?? null;

// ─── Store ────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      /**
       * Initialize auth listener. Call once at app start.
       * Returns unsubscribe function.
       */
      initialize: () => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Fetch or create user profile in Firestore
              let userProfile = await getDocument<User>('users', firebaseUser.uid);

              if (!userProfile) {
                // First-time user — create profile
                const newUser: Omit<User, 'uid'> = {
                  email: firebaseUser.email ?? '',
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
                  preferences: DEFAULT_USER_PREFERENCES,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                await createDocument('users', { ...newUser, uid: firebaseUser.uid }, firebaseUser.uid);
                userProfile = { uid: firebaseUser.uid, ...newUser } as User;
              }

              set({
                user: userProfile,
                firebaseUser,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
              });

              emitEvent('AUTH_STATE_CHANGED', { user: userProfile, isAuthenticated: true });
            } catch (err) {
              set({
                isLoading: false,
                isInitialized: true,
                error: 'Failed to load user profile',
              });
            }
          } else {
            set({
              user: null,
              firebaseUser: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
            emitEvent('AUTH_STATE_CHANGED', { user: null, isAuthenticated: false });
          }
        });

        return unsubscribe;
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await loginWithEmail(email, password);
          // Auth state listener will handle the rest
        } catch (err: any) {
          set({ isLoading: false, error: err.message ?? 'Login failed' });
          throw err;
        }
      },

      registerWithEmail: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          await registerWithEmail(email, password, displayName);
          // Auth state listener will handle the rest
        } catch (err: any) {
          set({ isLoading: false, error: err.message ?? 'Registration failed' });
          throw err;
        }
      },

      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          await loginWithGoogle(idToken);
        } catch (err: any) {
          set({ isLoading: false, error: err.message ?? 'Google sign-in failed' });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await firebaseLogout();
          // Auth state listener will handle the rest
        } catch (err: any) {
          set({ isLoading: false, error: err.message ?? 'Logout failed' });
        }
      },

      clearError: () => set({ error: null }),

      updateUserProfile: async (data) => {
        const { user } = get();
        if (!user) return;

        try {
          await updateDocument('users', user.uid, { ...data, updatedAt: Date.now() });
          set({ user: { ...user, ...data, updatedAt: Date.now() } });
        } catch (err: any) {
          set({ error: err.message ?? 'Profile update failed' });
        }
      },
    }),
    {
      name: '@aura/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
