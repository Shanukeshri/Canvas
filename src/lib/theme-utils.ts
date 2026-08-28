import { ThemeColor } from '@/types';

// Central theme mix parameters as specified in theme.txt
export const THEME_MIX = {
  primary: 0.06,   // 6% tint on background / primary surface
  secondary: 0.14, // 14% tint on cards / borders / secondary elements
  accent: 0.30,    // 30% tint on active controls / accents / glows
};

export const PRESET_THEMES: ThemeColor[] = [
  { id: 'crimson', name: 'Crimson', hex: '#34100F', hsl: { h: 355, s: 55, l: 13 } },
  { id: 'rose', name: 'Rose Ash', hex: '#B39292', hsl: { h: 0, s: 20, l: 64 } },
  { id: 'ruby', name: 'Ruby Focus', hex: '#D62828', hsl: { h: 0, s: 72, l: 50 } },
  { id: 'coral', name: 'Warm Coral', hex: '#F07167', hsl: { h: 4, s: 82, l: 68 } },
  { id: 'amber', name: 'Zen Amber', hex: '#F77F00', hsl: { h: 31, s: 100, l: 48 } },
  { id: 'gold', name: 'Solar Gold', hex: '#FCBF49', hsl: { h: 40, s: 96, l: 63 } },
  { id: 'emerald', name: 'Emerald Mind', hex: '#2A9D8F', hsl: { h: 172, s: 58, l: 39 } },
  { id: 'sage', name: 'Quiet Sage', hex: '#81B29A', hsl: { h: 150, s: 26, l: 60 } },
  { id: 'teal', name: 'Deep Teal', hex: '#0081A7', hsl: { h: 194, s: 100, l: 33 } },
  { id: 'cyan', name: 'Electric Cyan', hex: '#00AFB9', hsl: { h: 183, s: 100, l: 36 } },
  { id: 'sky', name: 'Serene Sky', hex: '#4EA8DE', hsl: { h: 202, s: 69, l: 59 } },
  { id: 'sapphire', name: 'Royal Sapphire', hex: '#0077B6', hsl: { h: 201, s: 100, l: 36 } },
  { id: 'indigo', name: 'Midnight Indigo', hex: '#3D5A80', hsl: { h: 214, s: 35, l: 37 } },
  { id: 'violet', name: 'Cosmic Violet', hex: '#7209B7', hsl: { h: 276, s: 91, l: 38 } },
  { id: 'amethyst', name: 'Deep Amethyst', hex: '#560BAD', hsl: { h: 268, s: 86, l: 36 } },
  { id: 'orchid', name: 'Soft Orchid', hex: '#B5179E', hsl: { h: 309, s: 77, l: 40 } },
  { id: 'magenta', name: 'Vibrant Magenta', hex: '#F72585', hsl: { h: 333, s: 93, l: 55 } },
  { id: 'charcoal', name: 'Slate Charcoal', hex: '#4A5568', hsl: { h: 218, s: 17, l: 35 } },
  { id: 'copper', name: 'Rustic Copper', hex: '#B85D19', hsl: { h: 26, s: 76, l: 41 } },
  { id: 'bronze', name: 'Muted Bronze', hex: '#9C6644', hsl: { h: 23, s: 39, l: 44 } },
  { id: 'olive', name: 'Peaceful Olive', hex: '#6B705C', hsl: { h: 75, s: 10, l: 40 } },
  { id: 'clay', name: 'Terracotta Clay', hex: '#CB997E', hsl: { h: 22, s: 44, l: 64 } },
  { id: 'monochrome', name: 'Pure Obsidian', hex: '#212529', hsl: { h: 210, s: 11, l: 15 } },
];

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function generateThemeCssVariables(
  accentHsl: { h: number; s: number; l: number },
  isDarkMode: boolean
): Record<string, string> {
  const { h, s } = accentHsl;

  if (isDarkMode) {
    // Dark mode tinting logic based on theme.txt & MD3 Crimson
    return {
      '--primary': `hsl(${h}, ${Math.min(s, 75)}%, 85%)`,
      '--on-primary': `hsl(${h}, 50%, 12%)`,
      '--primary-container': `hsl(${h}, 50%, 18%)`,
      '--on-primary-container': `hsl(${h}, 80%, 85%)`,
      '--primary-fixed': `hsl(${h}, 70%, 90%)`,
      '--primary-fixed-dim': `hsl(${h}, 60%, 82%)`,

      '--secondary': `hsl(${h}, ${Math.min(s, 50)}%, 75%)`,
      '--on-secondary': `hsl(${h}, 50%, 12%)`,
      '--secondary-container': `hsl(${h}, 40%, 25%)`,
      '--on-secondary-container': `hsl(${h}, 70%, 90%)`,

      '--tertiary': `hsl(${h}, ${Math.min(s, 60)}%, 80%)`,
      '--on-tertiary': `hsl(${h}, 60%, 10%)`,
      '--tertiary-container': `hsl(${h}, 50%, 20%)`,
      '--on-tertiary-container': `hsl(${h}, 70%, 85%)`,

      '--surface': `hsl(${h}, ${Math.min(s, 20)}%, 7%)`,
      '--on-surface': `hsl(${h}, 15%, 95%)`,
      '--surface-dim': `hsl(${h}, 15%, 5%)`,
      '--surface-bright': `hsl(${h}, 20%, 12%)`,
      '--surface-container-lowest': `hsl(${h}, 20%, 4%)`,
      '--surface-container-low': `hsl(${h}, 18%, 9%)`,
      '--surface-container': `hsl(${h}, 18%, 12%)`,
      '--surface-container-high': `hsl(${h}, 18%, 16%)`,
      '--surface-container-highest': `hsl(${h}, 18%, 20%)`,
      '--surface-variant': `hsl(${h}, 18%, 18%)`,
      '--on-surface-variant': `hsl(${h}, 15%, 78%)`,

      '--outline': `hsl(${h}, 10%, 55%)`,
      '--outline-variant': `hsla(${h}, 15%, 35%, 0.6)`,

      '--background': `hsl(${h}, ${Math.min(s, 20)}%, 7%)`,
      '--on-background': `hsl(${h}, 15%, 95%)`,

      '--zen-bg': `hsl(${h}, ${Math.min(s, 20)}%, 7%)`,
      '--zen-surface': `hsl(${h}, ${Math.min(s, 18)}%, 12%)`,
      '--zen-surface-hover': `hsl(${h}, ${Math.min(s, 18)}%, 16%)`,
      '--zen-card': `hsl(${h}, ${Math.min(s, 20)}%, 9%)`,
      '--zen-border': `hsla(${h}, 15%, 35%, 0.6)`,
      '--zen-border-strong': `hsl(${h}, 10%, 55%)`,
      '--zen-text': `hsl(${h}, 15%, 95%)`,
      '--zen-text-muted': `hsl(${h}, 15%, 75%)`,
      '--zen-accent': `hsl(${h}, ${Math.min(s, 75)}%, 85%)`,
      '--zen-accent-glow': `hsla(${h}, 75%, 75%, 0.35)`,
      '--zen-accent-hover': `hsl(${h}, 80%, 90%)`,
      '--zen-accent-subtle': `hsl(${h}, 50%, 18%)`,
      '--zen-ring': `hsl(${h}, ${Math.min(s, 75)}%, 85%)`,
    };
  } else {
    // Light mode tinting logic based on theme.txt & MD3 Crimson
    return {
      '--primary': `hsl(${h}, ${Math.max(s, 35)}%, 18%)`,
      '--on-primary': '#ffffff',
      '--primary-container': `hsl(${h}, ${Math.min(s, 25)}%, 90%)`,
      '--on-primary-container': `hsl(${h}, ${Math.max(s, 40)}%, 35%)`,
      '--primary-fixed': `hsl(${h}, 60%, 90%)`,
      '--primary-fixed-dim': `hsl(${h}, 50%, 82%)`,

      '--secondary': `hsl(${h}, ${Math.max(s, 40)}%, 42%)`,
      '--on-secondary': '#ffffff',
      '--secondary-container': `hsl(${h}, 80%, 75%)`,
      '--on-secondary-container': `hsl(${h}, 60%, 25%)`,

      '--tertiary': `hsl(${h}, ${Math.max(s, 35)}%, 15%)`,
      '--on-tertiary': '#ffffff',
      '--tertiary-container': `hsl(${h}, 40%, 90%)`,
      '--on-tertiary-container': `hsl(${h}, 50%, 45%)`,

      '--surface': `hsl(${h}, ${Math.min(s, 40)}%, 98%)`,
      '--on-surface': `hsl(${h}, 10%, 12%)`,
      '--surface-dim': `hsl(${h}, 15%, 88%)`,
      '--surface-bright': `hsl(${h}, 30%, 99%)`,
      '--surface-container-lowest': '#ffffff',
      '--surface-container-low': `hsl(${h}, 25%, 96%)`,
      '--surface-container': `hsl(${h}, 25%, 94%)`,
      '--surface-container-high': `hsl(${h}, 25%, 92%)`,
      '--surface-container-highest': `hsl(${h}, 25%, 90%)`,
      '--surface-variant': `hsl(${h}, 20%, 90%)`,
      '--on-surface-variant': `hsl(${h}, 10%, 30%)`,

      '--outline': `hsl(${h}, 8%, 48%)`,
      '--outline-variant': `hsl(${h}, 15%, 80%)`,

      '--background': `hsl(${h}, ${Math.min(s, 40)}%, 98%)`,
      '--on-background': `hsl(${h}, 10%, 12%)`,

      '--zen-bg': `hsl(${h}, ${Math.min(s, 40)}%, 98%)`,
      '--zen-surface': `hsl(${h}, 25%, 94%)`,
      '--zen-surface-hover': `hsl(${h}, 25%, 90%)`,
      '--zen-card': '#ffffff',
      '--zen-border': `hsl(${h}, 15%, 80%)`,
      '--zen-border-strong': `hsl(${h}, 8%, 48%)`,
      '--zen-text': `hsl(${h}, 10%, 12%)`,
      '--zen-text-muted': `hsl(${h}, 10%, 35%)`,
      '--zen-accent': `hsl(${h}, ${Math.max(s, 35)}%, 18%)`,
      '--zen-accent-glow': `hsla(${h}, 50%, 30%, 0.25)`,
      '--zen-accent-hover': `hsl(${h}, ${Math.max(s, 40)}%, 12%)`,
      '--zen-accent-subtle': `hsl(${h}, ${Math.min(s, 25)}%, 90%)`,
      '--zen-ring': `hsl(${h}, ${Math.max(s, 35)}%, 18%)`,
    };
  }
}
