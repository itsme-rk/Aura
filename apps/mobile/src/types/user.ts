// ─── User Types ───────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'email' | 'apple';
  createdAt: number;
  updatedAt: number;

  // Profile
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;

  // Streak Data
  workoutStreak?: number;
  proteinStreak?: number;
  activityStreak?: number;
  lastWorkoutDate?: string;   // YYYY-MM-DD
  lastProteinDate?: string;   // YYYY-MM-DD
  lastActiveDate?: string;    // YYYY-MM-DD

  // Preferences
  preferences: UserPreferences;
}

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  notificationSettings?: {
    workoutReminders: boolean;
    proteinReminders: boolean;
    streakReminders: boolean;
    reminderTimes: {
      workout: string;   // HH:mm
      protein: string;   // HH:mm
    };
    quietHoursStart: string;  // HH:mm
    quietHoursEnd: string;    // HH:mm
  };
  units: 'metric' | 'imperial';
  language: string;
  newsCategories: string[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  darkMode: true,
  notifications: true,
  notificationSettings: {
    workoutReminders: true,
    proteinReminders: true,
    streakReminders: true,
    reminderTimes: {
      workout: '19:00',
      protein: '20:00',
    },
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  units: 'metric',
  language: 'en',
  newsCategories: ['technology', 'science', 'health'],
};
