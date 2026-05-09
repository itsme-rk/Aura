// ─── Workout Types ────────────────────────────────────────
//
// Three distinct domains:
//   1. Exercise Library — master catalogue of exercises
//   2. Workout Plans   — planned weekly schedules
//   3. Workout Logs    — actual completed sessions
//
// These are intentionally separate systems.
//

// ═══════════════════════════════════════════════════════════
// EXERCISE LIBRARY
// ═══════════════════════════════════════════════════════════

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
  imageUrl?: string;
  videoUrl?: string;
  isCustom: boolean;
  createdBy?: string; // userId for custom exercises
  tags: string[];
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'forearms'
  | 'traps'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine'
  | 'ez_bar'
  | 'other'
  | 'none';

// ═══════════════════════════════════════════════════════════
// WORKOUT PLANS (scheduled / planned workouts)
// ═══════════════════════════════════════════════════════════

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  days: WorkoutDay[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutDay {
  dayOfWeek: number; // 0=Sunday ... 6=Saturday
  label: string;     // e.g. "Push Day", "Legs", "Rest"
  isRestDay: boolean;
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg?: number;
  restSeconds: number;
  notes?: string;
  order: number;
}

// ═══════════════════════════════════════════════════════════
// WORKOUT LOGS (actual completed workouts)
// ═══════════════════════════════════════════════════════════

export interface WorkoutLog {
  id: string;
  userId: string;
  planId?: string;        // optional link to the plan it came from
  dayLabel?: string;      // e.g. "Push Day" — for display
  name: string;
  startedAt: number;
  completedAt: number;
  durationMinutes: number;
  exercises: ExerciseLog[];
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: SetLog[];
  order: number;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weightKg: number;
  isWarmup: boolean;
  isCompleted: boolean;
  rpe?: number; // Rate of Perceived Exertion 1-10
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS / STREAK PREPARATION
// ═══════════════════════════════════════════════════════════

/** Precomputed summary for a single workout log — for fast analytics. */
export interface WorkoutSummary {
  logId: string;
  date: string;            // YYYY-MM-DD
  totalSets: number;
  totalReps: number;
  totalVolume: number;     // sum of (weight × reps) across all sets
  muscleGroups: MuscleGroup[];
  durationMinutes: number;
}

/** Used for recent-exercise quick-add feature. */
export interface RecentExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  lastWeight: number;
  lastReps: number;
  lastSets: number;
  lastUsedAt: number;
}
