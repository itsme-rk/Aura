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

  // Preferences
  preferences: UserPreferences;
}

export interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  units: 'metric' | 'imperial';
  language: string;
  newsCategories: string[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  darkMode: true,
  notifications: true,
  units: 'metric',
  language: 'en',
  newsCategories: ['technology', 'science', 'health'],
};
