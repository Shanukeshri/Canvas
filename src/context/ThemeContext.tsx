'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColor } from '@/types';
import { PRESET_THEMES, hexToHsl, generateThemeCssVariables } from '@/lib/theme-utils';

const THEME_STORAGE_KEY = 'canvas_theme_prefs_v1';
const LEGACY_THEME_STORAGE_KEY = 'zen_theme_prefs_v1';

interface ThemeContextType {
  theme: ThemeColor;
  customHex: string;
  isDarkMode: boolean;
  setTheme: (theme: ThemeColor) => void;
  setCustomColor: (hex: string) => void;
  toggleDarkMode: () => void;
  setIsDarkMode: (dark: boolean) => void;
  presetThemes: ThemeColor[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    // Restore from localStorage on mount (before auth completes)
    if (typeof window !== 'undefined') {
      try {
        const saved =
          localStorage.getItem(THEME_STORAGE_KEY) ||
          localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.themeHex) {
            const found = PRESET_THEMES.find((p) => p.hex.toLowerCase() === parsed.themeHex.toLowerCase());
            if (found) return found;
            // Custom color
            const hsl = hexToHsl(parsed.themeHex);
            return { id: 'custom', name: 'Custom Palette', hex: parsed.themeHex, hsl };
          }
        }
      } catch {}
    }
    return PRESET_THEMES[0];
  });

  const [customHex, setCustomHex] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved =
          localStorage.getItem(THEME_STORAGE_KEY) ||
          localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.themeHex || '#FF5722';
        }
      } catch {}
    }
    return '#FF5722';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved =
          localStorage.getItem(THEME_STORAGE_KEY) ||
          localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.isDarkMode === 'boolean') return parsed.isDarkMode;
        }
      } catch {}
    }
    return true; // Default dark
  });

  // Persist to localStorage whenever theme or dark mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          THEME_STORAGE_KEY,
          JSON.stringify({ themeHex: theme.hex, isDarkMode })
        );
      } catch {}
    }
  }, [theme.hex, isDarkMode]);

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
        setIsDarkMode,
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
