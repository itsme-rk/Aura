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
export {
  useNutritionStore,
  selectTodayLogs,
  selectTodayProtein,
  selectTodayCalories,
  selectTodaySummary,
  selectFoodLibrary,
  selectRecentFoods,
  selectNutritionGoals,
  selectProteinGoalMet,
  selectProteinRemaining,
  selectProteinProgress,
  selectNutritionLoading,
  selectTodayLog,
  selectCaloriesRemaining,
} from './nutritionStore';
export {
  useOfflineStore,
  selectIsOnline,
  selectIsSyncing,
  selectQueueSize,
  selectHasPendingSync,
  selectSyncProgress,
  selectFailedCount,
  selectLastSyncAt,
  selectSyncStatus,
} from './offlineStore';
export { useUIStore, selectIsDarkMode, selectGlobalLoading, selectToasts, selectActiveModal } from './uiStore';
export {
  useStreakStore,
  selectWorkoutStreak,
  selectProteinStreak,
  selectActivityStreak,
  selectStreakLoading,
} from './streakStore';
export {
  useReminderStore,
  selectActiveReminders,
  selectReminderSettings,
  selectHasReminders,
  selectReminderCount,
} from './reminderStore';
export {
  useNewsStore,
  selectNewsArticles,
  selectSavedArticles,
  selectReadLaterArticles,
  selectNewsCategory,
  selectNewsLoading,
  selectFilteredArticles,
} from './newsStore';
export {
  useSearchStore,
  selectSearchQuery,
  selectSearchResults,
  selectSearchDomain,
  selectRecentSearches,
  selectIsSearching,
} from './searchStore';
export {
  useProductStore,
  selectProducts,
  selectActiveProducts,
  selectProductLoading,
  selectFilteredProducts,
  selectProductSpending,
  selectExpiringProducts,
} from './productStore';
export {
  useScoreStore,
  selectCurrentScore,
  selectTotalScore,
  selectScoreTrend,
  selectScoreBreakdown,
} from './scoreStore';
export {
  useAnalyticsStore,
  selectDailyAnalytics,
  selectWeeklyAnalytics,
  selectAnalyticsLoading,
} from './analyticsStore';
