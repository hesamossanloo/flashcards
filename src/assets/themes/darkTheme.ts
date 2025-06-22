import { theme } from './theme';

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#18181b',
    surface: '#23232a',
    cardBackground: '#23232a',
    surfaceVariant: '#23232a',
    text: '#f3f4f6',
    textSecondary: '#a1a1aa',
    primary: '#6366f1',
    secondary: '#818cf8',
    error: '#ef4444',
    success: '#10b981',
  },
}; 