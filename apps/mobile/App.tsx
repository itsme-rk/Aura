// ─── Aura App Entry ───────────────────────────────────────
//
// Root component with auth gating and screen routing.
// Integrates: offline sync, reminders, streaks, nutrition,
//             news, search, products, scoring, analytics.
//

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen, RegisterScreen } from './src/features/auth';
import {
  WorkoutTodayScreen,
  AddWorkoutScreen,
  ExerciseDetailScreen,
  ProgressScreen,
} from './src/features/workout';
import {
  NutritionTodayScreen,
  AddProteinScreen,
  FoodSearchScreen,
} from './src/features/nutrition';
import { NewsHomeScreen, SavedArticlesScreen } from './src/features/news';
import { SearchScreen } from './src/features/search';
import { ProductVaultScreen, AddProductScreen } from './src/features/products';
import { useAuthInit, useAuth } from './src/hooks/useAuth';
import { useWorkoutStore } from './src/store';
import { useNutritionStore } from './src/store/nutritionStore';
import { useStreakStore } from './src/store/streakStore';
import { useOfflineStore } from './src/store/offlineStore';
import { useReminderStore } from './src/store/reminderStore';
import { useProductStore } from './src/store/productStore';
import { useScoreStore } from './src/store/scoreStore';
import { useAnalyticsStore } from './src/store/analyticsStore';
import { onEvent } from './src/services/events/emitEvent';
import { SyncStatusBar } from './src/components/SyncStatusBar';
import { ReminderBanner } from './src/components/ReminderBanner';
import { COLORS } from './src/constants/theme';

// ─── Screen Types ─────────────────────────────────────────

type AppScreen =
  | { name: 'home' }
  | { name: 'addWorkout'; params?: { name?: string; planId?: string; dayLabel?: string } }
  | { name: 'exerciseDetail'; params: { exerciseId: string } }
  | { name: 'progress' }
  | { name: 'nutrition' }
  | { name: 'addProtein' }
  | { name: 'foodSearch' }
  | { name: 'news' }
  | { name: 'savedArticles' }
  | { name: 'search' }
  | { name: 'products' }
  | { name: 'addProduct' };

type TabId = 'workout' | 'nutrition' | 'news' | 'more';

// ─── Auth Gate ────────────────────────────────────────────

function AuthGate() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');

  if (screen === 'register') {
    return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
  }
  return <LoginScreen onNavigateToRegister={() => setScreen('register')} />;
}

// ─── Main App (authenticated) ─────────────────────────────

function MainApp() {
  const { user, logout } = useAuth();
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' });
  const [activeTab, setActiveTab] = useState<TabId>('workout');

  // ─── Stores ─────────────────────────────────────────────
  const loadExercises = useWorkoutStore((s) => s.loadExercises);
  const workoutLogs = useWorkoutStore((s) => s.logs);
  const weeklyCount = useWorkoutStore((s) => s.weeklyCount);

  const fetchTodayLogs = useNutritionStore((s) => s.fetchTodayLogs);
  const todayProtein = useNutritionStore((s) => s.todayProtein);
  const proteinGoalMet = useNutritionStore((s) => s.proteinGoalMet);
  const nutritionGoals = useNutritionStore((s) => s.goals);

  const fetchStreaks = useStreakStore((s) => s.fetchStreaks);
  const handleWorkoutLogged = useStreakStore((s) => s.handleWorkoutLogged);
  const handleProteinGoalReached = useStreakStore((s) => s.handleProteinGoalReached);
  const validateAndRefresh = useStreakStore((s) => s.validateAndRefresh);
  const workoutStreak = useStreakStore((s) => s.workoutStreak);
  const proteinStreak = useStreakStore((s) => s.proteinStreak);
  const activityStreak = useStreakStore((s) => s.activityStreak);

  const initOffline = useOfflineStore((s) => s.initialize);

  const loadReminderSettings = useReminderStore((s) => s.loadSettings);
  const loadActiveReminders = useReminderStore((s) => s.loadActiveReminders);
  const evaluateReminders = useReminderStore((s) => s.evaluate);

  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const calculateScore = useScoreStore((s) => s.calculate);

  const loadAnalytics = useAnalyticsStore((s) => s.loadCached);
  const buildDaily = useAnalyticsStore((s) => s.buildDaily);

  // ─── Initialize on mount ────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    loadExercises(user.uid);
    fetchTodayLogs(user.uid);
    fetchStreaks(user.uid);
    fetchProducts(user.uid);
    validateAndRefresh();

    const cleanupOffline = initOffline();

    loadReminderSettings();
    loadActiveReminders();
    loadAnalytics();

    return () => {
      cleanupOffline();
    };
  }, [user?.uid]);

  // ─── Event Listeners ───────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const unsubWorkout = onEvent('WORKOUT_COMPLETED', () => {
      handleWorkoutLogged(user.uid);
    });

    const unsubProtein = onEvent('PROTEIN_GOAL_REACHED', () => {
      handleProteinGoalReached(user.uid);
    });

    return () => {
      unsubWorkout();
      unsubProtein();
    };
  }, [user?.uid]);

  // ─── Score + Analytics on foreground ────────────────────
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user?.uid) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const today = new Date().toISOString().split('T')[0];
        const hasWorkoutToday = workoutLogs.some((l) => {
          const logDate = new Date(l.startedAt).toISOString().split('T')[0];
          return logDate === today;
        });

        // Evaluate reminders
        evaluateReminders({
          hasWorkoutToday,
          workoutStreak,
          todayProtein,
          proteinTarget: nutritionGoals.dailyProteinTarget,
          proteinStreak,
        });

        // Calculate score
        calculateScore({
          workoutsThisWeek: weeklyCount,
          targetWorkoutsPerWeek: 4,
          daysProteinMet: proteinStreak, // approximation
          workoutStreak,
          proteinStreak,
          activityStreak,
          hasLoggedToday: hasWorkoutToday || todayProtein > 0,
          daysActiveThisWeek: Math.min(weeklyCount + (todayProtein > 0 ? 1 : 0), 7),
        });

        // Build daily analytics
        buildDaily({
          workoutsToday: hasWorkoutToday ? 1 : 0,
          totalProtein: todayProtein,
          proteinGoalMet,
          currentScore: useScoreStore.getState().currentScore?.totalScore,
        });
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, [user?.uid, workoutLogs.length, todayProtein, workoutStreak, proteinStreak, activityStreak, weeklyCount]);

  // ─── Navigation ─────────────────────────────────────────
  const navigate = useCallback((s: AppScreen) => setScreen(s), []);

  const handleTabPress = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'workout') setScreen({ name: 'home' });
    else if (tab === 'nutrition') setScreen({ name: 'nutrition' });
    else if (tab === 'news') setScreen({ name: 'news' });
    else if (tab === 'more') setScreen({ name: 'products' });
  }, []);

  // ─── Render ─────────────────────────────────────────────
  const renderScreen = () => {
    switch (screen.name) {
      case 'addWorkout':
        return (
          <AddWorkoutScreen
            initialName={screen.params?.name}
            initialPlanId={screen.params?.planId}
            initialDayLabel={screen.params?.dayLabel}
            onComplete={() => navigate({ name: 'home' })}
            onDiscard={() => navigate({ name: 'home' })}
          />
        );
      case 'exerciseDetail':
        return (
          <ExerciseDetailScreen
            exerciseId={screen.params.exerciseId}
            onBack={() => navigate({ name: 'home' })}
          />
        );
      case 'progress':
        return (
          <ProgressScreen
            onBack={() => navigate({ name: 'home' })}
            onViewExercise={(id) => navigate({ name: 'exerciseDetail', params: { exerciseId: id } })}
          />
        );
      case 'nutrition':
        return (
          <NutritionTodayScreen
            onAddProtein={() => navigate({ name: 'addProtein' })}
            onSearchFood={() => navigate({ name: 'foodSearch' })}
          />
        );
      case 'addProtein':
        return (
          <AddProteinScreen
            onComplete={() => navigate({ name: 'nutrition' })}
            onSearchFood={() => navigate({ name: 'foodSearch' })}
          />
        );
      case 'foodSearch':
        return (
          <FoodSearchScreen
            onComplete={() => navigate({ name: 'nutrition' })}
          />
        );
      case 'news':
        return (
          <NewsHomeScreen
            onViewCategory={() => {}}
            onViewSaved={() => navigate({ name: 'savedArticles' })}
          />
        );
      case 'savedArticles':
        return (
          <SavedArticlesScreen
            onBack={() => navigate({ name: 'news' })}
          />
        );
      case 'search':
        return (
          <SearchScreen
            onBack={() => navigate({ name: 'home' })}
            onViewExercise={(id) => navigate({ name: 'exerciseDetail', params: { exerciseId: id } })}
          />
        );
      case 'products':
        return (
          <ProductVaultScreen
            onAddProduct={() => navigate({ name: 'addProduct' })}
            onViewProduct={() => {}}
          />
        );
      case 'addProduct':
        return (
          <AddProductScreen
            onComplete={() => navigate({ name: 'products' })}
          />
        );
      case 'home':
      default:
        return (
          <WorkoutTodayScreen
            onStartWorkout={(name, planId, dayLabel) =>
              navigate({ name: 'addWorkout', params: { name, planId, dayLabel } })
            }
            onViewProgress={() => navigate({ name: 'progress' })}
            onViewExercise={(id) =>
              navigate({ name: 'exerciseDetail', params: { exerciseId: id } })
            }
          />
        );
    }
  };

  const hideBottomNav = [
    'addWorkout', 'exerciseDetail', 'progress',
    'addProtein', 'foodSearch', 'savedArticles',
    'search', 'addProduct',
  ].includes(screen.name);
  const showIndicators = !hideBottomNav;

  return (
    <View style={styles.mainContainer}>
      {showIndicators && <SyncStatusBar />}
      {showIndicators && screen.name === 'home' && <ReminderBanner />}

      {renderScreen()}

      {!hideBottomNav && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('workout')}>
            <Text style={[styles.navIcon, activeTab === 'workout' && styles.navActive]}>🏋️</Text>
            <Text style={[styles.navLabel, activeTab === 'workout' && styles.navActive]}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('nutrition')}>
            <Text style={[styles.navIcon, activeTab === 'nutrition' && styles.navActive]}>🥗</Text>
            <Text style={[styles.navLabel, activeTab === 'nutrition' && styles.navActive]}>Nutrition</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('news')}>
            <Text style={[styles.navIcon, activeTab === 'news' && styles.navActive]}>📰</Text>
            <Text style={[styles.navLabel, activeTab === 'news' && styles.navActive]}>News</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('more')}>
            <Text style={[styles.navIcon, activeTab === 'more' && styles.navActive]}>📦</Text>
            <Text style={[styles.navLabel, activeTab === 'more' && styles.navActive]}>Vault</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Loading Screen ───────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#7C5CFC" />
      <Text style={styles.loadingText}>Loading Aura...</Text>
    </View>
  );
}

// ─── Root App ─────────────────────────────────────────────

export default function App() {
  useAuthInit();
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return <LoadingScreen />;
  if (!isAuthenticated) return <AuthGate />;
  return <MainApp />;
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9898B0',
    fontSize: 16,
    marginTop: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#14141F',
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  navLabel: {
    fontSize: 10,
    color: '#5A5A72',
  },
  navActive: {
    opacity: 1,
    color: '#7C5CFC',
  },
});
