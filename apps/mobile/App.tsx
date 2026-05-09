// ─── Aura App Entry ───────────────────────────────────────
//
// Root component with auth gating and screen routing.
// Uses simple state-based navigation until expo-router is added.
//

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen, RegisterScreen } from './src/features/auth';
import {
  WorkoutTodayScreen,
  AddWorkoutScreen,
  ExerciseDetailScreen,
  ProgressScreen,
} from './src/features/workout';
import { useAuthInit, useAuth } from './src/hooks/useAuth';
import { useWorkoutStore } from './src/store';

// ─── Screen Types ─────────────────────────────────────────

type AppScreen =
  | { name: 'home' }
  | { name: 'addWorkout'; params?: { name?: string; planId?: string; dayLabel?: string } }
  | { name: 'exerciseDetail'; params: { exerciseId: string } }
  | { name: 'progress' };

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
  const loadExercises = useWorkoutStore((s) => s.loadExercises);

  // Load exercises on mount
  React.useEffect(() => {
    if (user?.uid) {
      loadExercises(user.uid);
    }
  }, [user?.uid]);

  const navigate = useCallback((s: AppScreen) => setScreen(s), []);

  // ─── Render Current Screen ──────────────────────────────
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

    case 'home':
    default:
      return (
        <View style={styles.mainContainer}>
          <WorkoutTodayScreen
            onStartWorkout={(name, planId, dayLabel) =>
              navigate({ name: 'addWorkout', params: { name, planId, dayLabel } })
            }
            onViewProgress={() => navigate({ name: 'progress' })}
            onViewExercise={(id) =>
              navigate({ name: 'exerciseDetail', params: { exerciseId: id } })
            }
          />

          {/* Bottom Nav Bar */}
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
              <Text style={[styles.navIcon, styles.navActive]}>🏋️</Text>
              <Text style={[styles.navLabel, styles.navActive]}>Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} disabled>
              <Text style={styles.navIcon}>🥗</Text>
              <Text style={styles.navLabel}>Nutrition</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} disabled>
              <Text style={styles.navIcon}>📰</Text>
              <Text style={styles.navLabel}>News</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={logout}>
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
  }
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

  // Bottom nav
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
