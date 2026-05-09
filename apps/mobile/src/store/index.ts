// ─── Store Barrel ─────────────────────────────────────────

export { useAuthStore, selectUser, selectIsAuthenticated, selectAuthLoading, selectAuthError, selectUserId } from './authStore';
export {
  useWorkoutStore,
  selectExercises,
  selectPlans,
  selectActivePlan,
  selectLogs,
  selectRecentLogs,
  selectActiveSession,
  selectRecentExercises,
  selectStreak,
  selectWeeklyCount,
  selectWorkoutLoading,
  selectWorkoutError,
} from './workoutStore';
export { useNutritionStore, selectTodayLog, selectNutritionGoals, selectNutritionLoading, selectCaloriesRemaining } from './nutritionStore';
export { useOfflineStore, selectIsOnline, selectIsSyncing, selectQueueSize, selectHasPendingSync } from './offlineStore';
export { useUIStore, selectIsDarkMode, selectGlobalLoading, selectToasts, selectActiveModal } from './uiStore';
