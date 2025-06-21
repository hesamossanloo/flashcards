import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1', // Modern indigo
    secondary: '#8b5cf6', // Purple
    tertiary: '#06b6d4', // Cyan
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    error: '#ef4444',
    text: '#1e293b',
    textSecondary: '#64748b',
    onSurface: '#1e293b',
    disabled: '#94a3b8',
    placeholder: '#cbd5e1',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    notification: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    // Gradient colors
    gradientStart: '#6366f1',
    gradientEnd: '#8b5cf6',
    // Card colors
    cardBackground: '#ffffff',
    cardBorder: '#e2e8f0',
    // Progress colors
    progressBackground: '#e2e8f0',
    progressFill: '#6366f1',
  },
  roundness: 12,
  animation: {
    scale: 1.0,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

export type AppTheme = typeof theme; 