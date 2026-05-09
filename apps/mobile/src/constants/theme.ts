// ─── App Theme ────────────────────────────────────────────
//
// Shared dark UI design tokens used across all features.
// Auth theme was the starting point; now consolidated here.
//

export const COLORS = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceLight: '#1E1E2E',
  card: '#1A1A2A',
  cardElevated: '#22223A',

  // Brand
  primary: '#7C5CFC',
  primaryLight: '#9B7FFF',
  primaryDark: '#5A3FD4',

  // Accent
  accent: '#4AE0D2',
  accentDark: '#38B5A8',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9898B0',
  textMuted: '#5A5A72',
  textPlaceholder: '#4A4A62',

  // States
  error: '#FF4D6A',
  errorBg: 'rgba(255, 77, 106, 0.12)',
  success: '#4ADE80',
  successBg: 'rgba(74, 222, 128, 0.12)',
  warning: '#FBBF24',
  warningBg: 'rgba(251, 191, 36, 0.12)',
  info: '#60A5FA',
  infoBg: 'rgba(96, 165, 250, 0.12)',

  // Borders
  border: '#2A2A3E',
  borderFocus: '#7C5CFC',

  // Misc
  divider: '#1E1E2E',
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#FFFFFF',
  black: '#000000',

  // Muscle group colors (for badges)
  muscle: {
    chest: '#FF6B8A',
    back: '#60A5FA',
    shoulders: '#FBBF24',
    biceps: '#F472B6',
    triceps: '#A78BFA',
    quads: '#4ADE80',
    hamstrings: '#34D399',
    glutes: '#F97316',
    calves: '#22D3EE',
    core: '#E879F9',
    forearms: '#FB923C',
    traps: '#818CF8',
    cardio: '#F43F5E',
    full_body: '#7C5CFC',
  } as Record<string, string>,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  smallBold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
} as const;
