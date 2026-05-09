// ─── UI Store ─────────────────────────────────────────────
//
// Global UI state — theme, modals, toasts, navigation.
// NOT persisted (ephemeral per session, except theme).
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── State Interface ──────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Loading overlay
  globalLoading: boolean;
  globalLoadingMessage: string | null;
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Toast notifications
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;

  // Modal
  activeModal: string | null;
  modalData: unknown;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;

  // Bottom sheet / drawer
  activeSheet: string | null;
  openSheet: (sheetId: string) => void;
  closeSheet: () => void;
}

// ─── Selectors ────────────────────────────────────────────

export const selectIsDarkMode = (state: UIState) => state.isDarkMode;
export const selectGlobalLoading = (state: UIState) => state.globalLoading;
export const selectToasts = (state: UIState) => state.toasts;
export const selectActiveModal = (state: UIState) => state.activeModal;

// ─── Store ────────────────────────────────────────────────

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: true,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Global loading
      globalLoading: false,
      globalLoadingMessage: null,
      setGlobalLoading: (loading, message) =>
        set({ globalLoading: loading, globalLoadingMessage: message ?? null }),

      // Toasts
      toasts: [],
      showToast: (message, type = 'info', duration = 3000) => {
        const id = `toast_${Date.now()}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, type, duration }],
        }));

        // Auto-dismiss
        if (duration > 0) {
          setTimeout(() => get().dismissToast(id), duration);
        }
      },
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Modal
      activeModal: null,
      modalData: null,
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Bottom sheet
      activeSheet: null,
      openSheet: (sheetId) => set({ activeSheet: sheetId }),
      closeSheet: () => set({ activeSheet: null }),
    }),
    {
      name: '@aura/ui',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist theme preference
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
