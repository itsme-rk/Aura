// ─── Auth Theme Constants ─────────────────────────────────
//
// Dark UI design system for auth screens.
//

export const AUTH_COLORS = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceLight: '#1E1E2E',
  card: '#1A1A2A',

  // Brand
  primary: '#7C5CFC',
  primaryLight: '#9B7FFF',
  primaryDark: '#5A3FD4',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9898B0',
  textMuted: '#5A5A72',
  textPlaceholder: '#4A4A62',

  // States
  error: '#FF4D6A',
  errorBackground: 'rgba(255, 77, 106, 0.12)',
  success: '#4ADE80',
  warning: '#FBBF24',

  // Borders
  border: '#2A2A3E',
  borderFocus: '#7C5CFC',

  // Misc
  divider: '#1E1E2E',
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const AUTH_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const AUTH_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const AUTH_TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;
