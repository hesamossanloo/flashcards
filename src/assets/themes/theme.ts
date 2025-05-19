import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f6f6f6',
    surface: '#ffffff',
    error: '#B00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#757575',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
  },
  roundness: 4,
  animation: {
    scale: 1.0,
  },
};

export type AppTheme = typeof theme; 