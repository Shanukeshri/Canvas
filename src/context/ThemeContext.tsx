'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColor } from '@/types';
import { PRESET_THEMES, hexToHsl, generateThemeCssVariables } from '@/lib/theme-utils';

interface ThemeContextType {
  theme: ThemeColor;
  customHex: string;
  isDarkMode: boolean;
  setTheme: (theme: ThemeColor) => void;
  setCustomColor: (hex: string) => void;
  toggleDarkMode: () => void;
  presetThemes: ThemeColor[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(PRESET_THEMES[0]); // Default Crimson
  const [customHex, setCustomHex] = useState<string>('#FF5722');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Apply theme variables dynamically to the document root element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const cssVars = generateThemeCssVariables(theme.hex, isDarkMode);
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme, isDarkMode]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
  };

  const setCustomColor = (hex: string) => {
    setCustomHex(hex);
    const hsl = hexToHsl(hex);
    const customTheme: ThemeColor = {
      id: 'custom',
      name: 'Custom Palette',
      hex,
      hsl,
    };
    setThemeState(customTheme);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        customHex,
        isDarkMode,
        setTheme,
        setCustomColor,
        toggleDarkMode,
        presetThemes: PRESET_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
