import { createContext } from 'react';

export type ThemeName = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
