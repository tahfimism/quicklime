import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FAF9F6', // Warm off-white base
    onBackground: '#1B1C1A', // Near black
    surface: '#FFFFFF', // Clean white card surfaces
    surfaceDim: '#DBDAD7',
    surfaceBright: '#FAF9F6',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F4F3F0',
    surfaceContainer: '#EFEEEB', // Muted container background
    surfaceContainerHigh: '#E9E8E5',
    surfaceContainerHighest: '#E3E2DF',
    onSurface: '#1B1C1A',
    onSurfaceVariant: '#404943',
    inverseSurface: '#2F312F',
    inverseOnSurface: '#F2F1EE',
    outline: '#707973',
    outlineVariant: '#BFC9C1',
    primary: '#0F5238', // Deep green primary actions
    onPrimary: '#FFFFFF',
    primaryContainer: '#2D6A4F', // Accent sage green
    onPrimaryContainer: '#A8E7C5',
    inversePrimary: '#95D4B3',
    secondary: '#5F5E5D', // Muted slate secondary text
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E2DFDD',
    onSecondaryContainer: '#636261',
    tertiary: '#4A4740',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#625F57',
    onTertiaryContainer: '#DED9CF',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6', // Warning backgrounds (e.g. tests)
    onErrorContainer: '#93000A',
    line: '#E4E2DD', // Border lines
    sunken: '#EEECE8', // Tab bar base
    accentMuted: '#EAF1ED',
    destructive: '#C0392B',
    textTertiary: '#AEADA8',
  },
  dark: {
    background: '#111110', // Dark background base
    onBackground: '#F0EFE9',
    surface: '#1C1C1A', // Dark surface cards
    surfaceDim: '#0C0C0B',
    surfaceBright: '#1C1C1A',
    surfaceContainerLowest: '#0A0A09',
    surfaceContainerLow: '#141413',
    surfaceContainer: '#1E1E1C',
    surfaceContainerHigh: '#282826',
    surfaceContainerHighest: '#323230',
    onSurface: '#F0EFE9',
    onSurfaceVariant: '#8A8880',
    inverseSurface: '#E3E2DF',
    inverseOnSurface: '#1B1C1A',
    outline: '#8A8880',
    outlineVariant: '#4A4845',
    primary: '#52B788', // Lighter green for dark mode accessibility
    onPrimary: '#111110',
    primaryContainer: '#1A2E23', // Dark accent background
    onPrimaryContainer: '#95D4B3',
    inversePrimary: '#0F5238',
    secondary: '#8A8880',
    onSecondary: '#111110',
    secondaryContainer: '#2D2D2A',
    onSecondaryContainer: '#8A8880',
    tertiary: '#CBC6BC',
    onTertiary: '#111110',
    tertiaryContainer: '#4A4845',
    onTertiaryContainer: '#DED9CF',
    error: '#E55A4E',
    onError: '#111110',
    errorContainer: '#3C1613',
    onErrorContainer: '#FFDAD6',
    line: '#2A2A27', // Darker dividers
    sunken: '#0C0C0B',
    accentMuted: '#1A2E23',
    destructive: '#E55A4E',
    textTertiary: '#4A4845',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  marginH: 20,
  buttonHeight: 50,
} as const;

export const Radii = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TypographyVariants = {
  displayWordmark: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  headlineLg: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  headlineLgMobile: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  eventTitle: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  courseName: {
    fontFamily: 'InstrumentSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  bodyMd: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  sectionHeader: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  labelMd: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  dataMono: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0,
  },
  codeMono: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
} as const;

export type TypographyVariant = keyof typeof TypographyVariants;

export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
