import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const colors = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#06d6a0',
  danger: '#ef476f',
  warning: '#ffd166',
  info: '#118ab2',

  income: '#06d6a0',
  expense: '#ef476f',

  background: {
    light: '#f8f9fa',
    dark: '#1a1a2e',
  },
  surface: {
    light: '#ffffff',
    dark: '#16213e',
  },
  card: {
    light: '#ffffff',
    dark: '#0f3460',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background.light,
    surface: colors.surface.light,
    error: colors.danger,
  },
  custom: {
    income: colors.income,
    expense: colors.expense,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    card: colors.card.light,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background.dark,
    surface: colors.surface.dark,
    error: colors.danger,
  },
  custom: {
    income: colors.income,
    expense: colors.expense,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    card: colors.card.dark,
  },
};

export type AppTheme = typeof lightTheme;

export { colors };
