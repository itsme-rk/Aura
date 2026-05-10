// ─── Exercise Library ─────────────────────────────────────
//
// Built-in exercise catalogue. Covers all major movement patterns.
// Users can add custom exercises on top of this.
//

import { Exercise, MuscleGroup, Equipment } from '../../../types';

// ─── Default Library ──────────────────────────────────────

export const DEFAULT_EXERCISES: Exercise[] = [
  // ─── Chest ──────────────────────────────────────────────
  {
    id: 'ex_bench_press',
    name: 'Barbell Bench Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    instructions: 'Lie on bench, grip bar shoulder-width. Lower to chest, press up to lockout.',
    isCustom: false,
    tags: ['compound', 'push', 'upper'],
  },
  {
    id: 'ex_incline_bench',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    instructions: 'Set bench to 30-45°. Press dumbbells up from chest level.',
    isCustom: false,
    tags: ['compound', 'push', 'upper'],
  },
  {
    id: 'ex_chest_fly',
    name: 'Dumbbell Chest Fly',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    instructions: 'Lie flat, arms extended. Lower dumbbells in arc to sides, squeeze back up.',
    isCustom: false,
    tags: ['isolation', 'push', 'upper'],
  },
  {
    id: 'ex_cable_crossover',
    name: 'Cable Crossover',
    muscleGroup: 'chest',
    equipment: 'cable',
    instructions: 'Stand between cables set high. Pull handles down and together in front.',
    isCustom: false,
    tags: ['isolation', 'push', 'upper'],
  },
  {
    id: 'ex_pushup',
    name: 'Push-Up',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'core'],
    equipment: 'bodyweight',
    instructions: 'Hands shoulder-width, lower chest to floor, push back up.',
    isCustom: false,
    tags: ['compound', 'push', 'bodyweight'],
  },

  // ─── Back ───────────────────────────────────────────────
  {
    id: 'ex_deadlift',
    name: 'Barbell Deadlift',
    muscleGroup: 'back',
    secondaryMuscles: ['hamstrings', 'glutes', 'traps', 'core'],
    equipment: 'barbell',
    instructions: 'Stand over bar, hinge at hips, grip bar, drive through heels to stand.',
    isCustom: false,
    tags: ['compound', 'pull', 'posterior'],
  },
  {
    id: 'ex_barbell_row',
    name: 'Barbell Bent-Over Row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'traps'],
    equipment: 'barbell',
    instructions: 'Hinge forward 45°, pull bar to lower chest, squeeze shoulder blades.',
    isCustom: false,
    tags: ['compound', 'pull', 'upper'],
  },
  {
    id: 'ex_lat_pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    instructions: 'Grip bar wide, pull down to upper chest, control the return.',
    isCustom: false,
    tags: ['compound', 'pull', 'upper'],
  },
  {
    id: 'ex_pullup',
    name: 'Pull-Up',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'bodyweight',
    instructions: 'Hang from bar, pull chin above bar, lower with control.',
    isCustom: false,
    tags: ['compound', 'pull', 'bodyweight'],
  },
  {
    id: 'ex_cable_row',
    name: 'Seated Cable Row',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'traps'],
    equipment: 'cable',
    instructions: 'Sit upright, pull handle to torso, squeeze shoulder blades.',
    isCustom: false,
    tags: ['compound', 'pull', 'upper'],
  },

  // ─── Shoulders ──────────────────────────────────────────
  {
    id: 'ex_ohp',
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps', 'traps'],
    equipment: 'barbell',
    instructions: 'Press bar from shoulders to overhead lockout. Keep core tight.',
    isCustom: false,
    tags: ['compound', 'push', 'upper'],
  },
  {
    id: 'ex_lateral_raise',
    name: 'Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    instructions: 'Raise dumbbells to sides until arms parallel to floor.',
    isCustom: false,
    tags: ['isolation', 'push', 'upper'],
  },
  {
    id: 'ex_face_pull',
    name: 'Face Pull',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['traps'],
    equipment: 'cable',
    instructions: 'Pull rope to face with elbows high, squeeze rear delts.',
    isCustom: false,
    tags: ['isolation', 'pull', 'upper'],
  },
  {
    id: 'ex_db_shoulder_press',
    name: 'Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    instructions: 'Press dumbbells from shoulder height to overhead.',
    isCustom: false,
    tags: ['compound', 'push', 'upper'],
  },

  // ─── Biceps ─────────────────────────────────────────────
  {
    id: 'ex_barbell_curl',
    name: 'Barbell Curl',
    muscleGroup: 'biceps',
    equipment: 'barbell',
    instructions: 'Curl bar from thighs to shoulders, keep elbows stationary.',
    isCustom: false,
    tags: ['isolation', 'pull', 'arms'],
  },
  {
    id: 'ex_db_curl',
    name: 'Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    instructions: 'Alternate curling dumbbells, supinate at the top.',
    isCustom: false,
    tags: ['isolation', 'pull', 'arms'],
  },
  {
    id: 'ex_hammer_curl',
    name: 'Hammer Curl',
    muscleGroup: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
    instructions: 'Curl with neutral grip (palms facing each other).',
    isCustom: false,
    tags: ['isolation', 'pull', 'arms'],
  },

  // ─── Triceps ────────────────────────────────────────────
  {
    id: 'ex_tricep_pushdown',
    name: 'Tricep Pushdown',
    muscleGroup: 'triceps',
    equipment: 'cable',
    instructions: 'Push cable attachment down from chest to lockout.',
    isCustom: false,
    tags: ['isolation', 'push', 'arms'],
  },
  {
    id: 'ex_skull_crusher',
    name: 'Skull Crusher',
    muscleGroup: 'triceps',
    equipment: 'ez_bar',
    instructions: 'Lie flat, lower bar to forehead, extend arms.',
    isCustom: false,
    tags: ['isolation', 'push', 'arms'],
  },
  {
    id: 'ex_overhead_extension',
    name: 'Overhead Tricep Extension',
    muscleGroup: 'triceps',
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell overhead, lower behind head, extend.',
    isCustom: false,
    tags: ['isolation', 'push', 'arms'],
  },
  {
    id: 'ex_dips',
    name: 'Dips',
    muscleGroup: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    instructions: 'Support on parallel bars, lower body, press up.',
    isCustom: false,
    tags: ['compound', 'push', 'bodyweight'],
  },

  // ─── Legs ───────────────────────────────────────────────
  {
    id: 'ex_squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell',
    instructions: 'Bar on upper back, squat to parallel or below, drive up.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },
  {
    id: 'ex_front_squat',
    name: 'Front Squat',
    muscleGroup: 'quads',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'barbell',
    instructions: 'Bar on front delts, squat deep with upright torso.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },
  {
    id: 'ex_leg_press',
    name: 'Leg Press',
    muscleGroup: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'machine',
    instructions: 'Feet shoulder-width on platform, press out, control return.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },
  {
    id: 'ex_leg_extension',
    name: 'Leg Extension',
    muscleGroup: 'quads',
    equipment: 'machine',
    instructions: 'Extend legs against pad from 90° to straight.',
    isCustom: false,
    tags: ['isolation', 'push', 'lower'],
  },
  {
    id: 'ex_leg_curl',
    name: 'Leg Curl',
    muscleGroup: 'hamstrings',
    equipment: 'machine',
    instructions: 'Curl heels toward glutes against pad.',
    isCustom: false,
    tags: ['isolation', 'pull', 'lower'],
  },
  {
    id: 'ex_rdl',
    name: 'Romanian Deadlift',
    muscleGroup: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    instructions: 'Hinge at hips with slight knee bend, lower bar along legs.',
    isCustom: false,
    tags: ['compound', 'pull', 'lower'],
  },
  {
    id: 'ex_bulgarian_split',
    name: 'Bulgarian Split Squat',
    muscleGroup: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'dumbbell',
    instructions: 'Rear foot elevated, lunge down on front leg.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },
  {
    id: 'ex_hip_thrust',
    name: 'Hip Thrust',
    muscleGroup: 'glutes',
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    instructions: 'Upper back on bench, drive hips up with bar on lap.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },
  {
    id: 'ex_calf_raise',
    name: 'Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    instructions: 'Rise onto toes, squeeze at top, lower with stretch.',
    isCustom: false,
    tags: ['isolation', 'push', 'lower'],
  },
  {
    id: 'ex_lunges',
    name: 'Walking Lunges',
    muscleGroup: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    instructions: 'Step forward into lunge, alternate legs walking forward.',
    isCustom: false,
    tags: ['compound', 'push', 'lower'],
  },

  // ─── Core ───────────────────────────────────────────────
  {
    id: 'ex_plank',
    name: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    instructions: 'Hold rigid straight-body position on forearms and toes.',
    isCustom: false,
    tags: ['isometric', 'core', 'bodyweight'],
  },
  {
    id: 'ex_hanging_leg_raise',
    name: 'Hanging Leg Raise',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    instructions: 'Hang from bar, raise legs to parallel or above.',
    isCustom: false,
    tags: ['isolation', 'core', 'bodyweight'],
  },
  {
    id: 'ex_cable_crunch',
    name: 'Cable Crunch',
    muscleGroup: 'core',
    equipment: 'cable',
    instructions: 'Kneel at cable, crunch down bringing elbows to knees.',
    isCustom: false,
    tags: ['isolation', 'core'],
  },
  {
    id: 'ex_ab_rollout',
    name: 'Ab Rollout',
    muscleGroup: 'core',
    equipment: 'other',
    instructions: 'Kneel with wheel, roll out extending body, roll back in.',
    isCustom: false,
    tags: ['compound', 'core'],
  },

  // ─── Cardio ─────────────────────────────────────────────
  {
    id: 'ex_treadmill',
    name: 'Treadmill Run',
    muscleGroup: 'cardio',
    equipment: 'machine',
    instructions: 'Run on treadmill at chosen speed and incline.',
    isCustom: false,
    tags: ['cardio', 'endurance'],
  },
  {
    id: 'ex_cycling',
    name: 'Stationary Bike',
    muscleGroup: 'cardio',
    secondaryMuscles: ['quads'],
    equipment: 'machine',
    instructions: 'Cycle at steady or interval pace.',
    isCustom: false,
    tags: ['cardio', 'endurance'],
  },
  {
    id: 'ex_rowing',
    name: 'Rowing Machine',
    muscleGroup: 'cardio',
    secondaryMuscles: ['back', 'core'],
    equipment: 'machine',
    instructions: 'Drive with legs, pull handle to chest, return with control.',
    isCustom: false,
    tags: ['cardio', 'endurance', 'full_body'],
  },
  {
    id: 'ex_jump_rope',
    name: 'Jump Rope',
    muscleGroup: 'cardio',
    secondaryMuscles: ['calves'],
    equipment: 'other',
    instructions: 'Jump over rope with both feet, maintain rhythm.',
    isCustom: false,
    tags: ['cardio', 'bodyweight'],
  },
];

// ─── Helpers ──────────────────────────────────────────────

/** Group exercises by muscle group for dropdown display. */
export function getExercisesByMuscle(
  exercises: Exercise[],
): Record<MuscleGroup, Exercise[]> {
  const grouped = {} as Record<MuscleGroup, Exercise[]>;
  for (const ex of exercises) {
    if (!grouped[ex.muscleGroup]) {
      grouped[ex.muscleGroup] = [];
    }
    grouped[ex.muscleGroup].push(ex);
  }
  return grouped;
}

/** Readable label for muscle group. */
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  forearms: 'Forearms',
  traps: 'Traps',
  cardio: 'Cardio',
  full_body: 'Full Body',
};

/** Readable label for equipment. */
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  resistance_band: 'Band',
  smith_machine: 'Smith Machine',
  ez_bar: 'EZ Bar',
  other: 'Other',
  none: 'None',
};

/** Search exercises by name or tag. */
export function searchExercises(
  exercises: Exercise[],
  query: string,
): Exercise[] {
  const q = query.toLowerCase().trim();
  if (!q) return exercises;
  return exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroup.includes(q) ||
      ex.tags.some((t) => t.includes(q)),
  );
}
