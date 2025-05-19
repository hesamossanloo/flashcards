import { useColorScheme } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: {
      fontSize: number;
      lineHeight: number;
      fontWeight: string;
    };
    h2: {
      fontSize: number;
      lineHeight: number;
      fontWeight: string;
    };
    body: {
      fontSize: number;
      lineHeight: number;
    };
    caption: {
      fontSize: number;
      lineHeight: number;
    };
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF4081',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    success: '#00C851',
    error: '#FF4444',
    warning: '#FFBB33',
    info: '#33B5E5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
    },
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#2C2C2C',
  },
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
} 