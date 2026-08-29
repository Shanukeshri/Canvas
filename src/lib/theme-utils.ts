import { ThemeColor } from '@/types';

// Central theme mix percentages as defined in theme.txt
export const THEME_MIX = {
  primary: 0.05,   // 5% tint on base background / canvas
  secondary: 0.12, // 12% tint on secondary surfaces / cards / borders
  accent: 0.25,    // 25% tint on accent / active elements / text
};

// 23 Predefined Harmonious Themes
export const PRESET_THEMES: ThemeColor[] = [
  { id: 'crimson', name: 'Crimson', hex: '#8B1E1E', hsl: { h: 0, s: 64, l: 33 } },
  { id: 'rose', name: 'Rose Ash', hex: '#B35D72', hsl: { h: 345, s: 36, l: 53 } },
  { id: 'ruby', name: 'Ruby Focus', hex: '#C52233', hsl: { h: 354, s: 71, l: 45 } },
  { id: 'coral', name: 'Warm Coral', hex: '#E05A47', hsl: { h: 7, s: 73, l: 58 } },
  { id: 'amber', name: 'Zen Amber', hex: '#D97706', hsl: { h: 32, s: 95, l: 44 } },
  { id: 'gold', name: 'Solar Gold', hex: '#CA8A04', hsl: { h: 42, s: 94, l: 40 } },
  { id: 'emerald', name: 'Emerald Mind', hex: '#059669', hsl: { h: 160, s: 84, l: 31 } },
  { id: 'sage', name: 'Quiet Sage', hex: '#4D7C0F', hsl: { h: 84, s: 85, l: 27 } },
  { id: 'teal', name: 'Deep Teal', hex: '#0D9488', hsl: { h: 175, s: 84, l: 32 } },
  { id: 'cyan', name: 'Minimal Cyan', hex: '#0891B2', hsl: { h: 192, s: 91, l: 36 } },
  { id: 'sky', name: 'Serene Sky', hex: '#0284C7', hsl: { h: 201, s: 98, l: 39 } },
  { id: 'sapphire', name: 'Royal Sapphire', hex: '#2563EB', hsl: { h: 221, s: 83, l: 53 } },
  { id: 'indigo', name: 'Midnight Indigo', hex: '#4F46E5', hsl: { h: 244, s: 75, l: 59 } },
  { id: 'violet', name: 'Cosmic Violet', hex: '#7C3AED', hsl: { h: 263, s: 84, l: 58 } },
  { id: 'amethyst', name: 'Deep Amethyst', hex: '#9333EA', hsl: { h: 271, s: 81, l: 56 } },
  { id: 'orchid', name: 'Soft Orchid', hex: '#C026D3', hsl: { h: 293, s: 69, l: 49 } },
  { id: 'magenta', name: 'Vibrant Magenta', hex: '#DB2777', hsl: { h: 330, s: 79, l: 51 } },
  { id: 'charcoal', name: 'Slate Charcoal', hex: '#475569', hsl: { h: 215, s: 19, l: 35 } },
  { id: 'copper', name: 'Rustic Copper', hex: '#B45309', hsl: { h: 26, s: 90, l: 37 } },
  { id: 'bronze', name: 'Muted Bronze', hex: '#78350F', hsl: { h: 22, s: 78, l: 26 } },
  { id: 'olive', name: 'Peaceful Olive', hex: '#65A30D', hsl: { h: 84, s: 80, l: 35 } },
  { id: 'clay', name: 'Terracotta Clay', hex: '#A16207', hsl: { h: 36, s: 88, l: 33 } },
  { id: 'monochrome', name: 'Pure Obsidian', hex: '#52525B', hsl: { h: 240, s: 5, l: 34 } },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 139, g: 30, b: 30 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Mixes a base RGB color with a tint RGB color by a given weight factor (0.0 to 1.0).
 */
export function mixColor(
  base: { r: number; g: number; b: number },
  tint: { r: number; g: number; b: number },
  weight: number
): string {
  const r = Math.round(base.r * (1 - weight) + tint.r * weight);
  const g = Math.round(base.g * (1 - weight) + tint.g * weight);
  const b = Math.round(base.b * (1 - weight) + tint.b * weight);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Centrally derives all minimalist UI theme variables from base tones (White/Grey/Black)
 * mixed with the user's selected accent color.
 * No heavy glows, completely zen and calm.
 */
export function generateThemeCssVariables(
  selectedHex: string,
  isDarkMode: boolean
): Record<string, string> {
  const tint = hexToRgb(selectedHex);

  if (isDarkMode) {
    // Base Tones for DARK MODE:
    // Primary Base: Black
    // Secondary Base: Dark Grey
    // Accent Base: Crisp White
    const baseBlack = { r: 11, g: 11, b: 14 };
    const baseCard = { r: 18, g: 18, b: 22 };
    const baseSurfaceHigh = { r: 25, g: 25, b: 30 };
    const baseBorder = { r: 40, g: 40, b: 46 };
    const baseOutlineVariant = { r: 52, g: 52, b: 60 };
    const baseMutedText = { r: 155, g: 155, b: 165 };
    const baseWhite = { r: 245, g: 245, b: 248 };

    // Subtle mixing
    const bgTint = mixColor(baseBlack, tint, THEME_MIX.primary); // 5% tint
    const cardTint = mixColor(baseCard, tint, THEME_MIX.secondary); // 12% tint
    const hoverTint = mixColor(baseSurfaceHigh, tint, THEME_MIX.secondary);
    const borderTint = mixColor(baseBorder, tint, THEME_MIX.secondary);
    const outlineVarTint = mixColor(baseOutlineVariant, tint, THEME_MIX.secondary);
    const mutedTextTint = mixColor(baseMutedText, tint, THEME_MIX.primary * 2);
    const primaryActiveTint = mixColor(baseWhite, tint, THEME_MIX.accent); // 25% tint

    return {
      '--primary': primaryActiveTint,
      '--on-primary': '#0a0a0c',
      '--primary-container': cardTint,
      '--on-primary-container': primaryActiveTint,
      '--primary-fixed': primaryActiveTint,
      '--primary-fixed-dim': primaryActiveTint,

      '--secondary': mutedTextTint,
      '--on-secondary': '#0a0a0c',
      '--secondary-container': cardTint,
      '--on-secondary-container': primaryActiveTint,

      '--tertiary': primaryActiveTint,
      '--on-tertiary': '#0a0a0c',
      '--tertiary-container': cardTint,
      '--on-tertiary-container': primaryActiveTint,

      '--surface': bgTint,
      '--on-surface': baseWhite ? `rgb(${baseWhite.r}, ${baseWhite.g}, ${baseWhite.b})` : '#f5f5f7',
      '--surface-dim': bgTint,
      '--surface-bright': hoverTint,
      '--surface-container-lowest': bgTint,
      '--surface-container-low': cardTint,
      '--surface-container': hoverTint,
      '--surface-container-high': hoverTint,
      '--surface-container-highest': hoverTint,
      '--surface-variant': borderTint,
      '--on-surface-variant': mutedTextTint,

      '--outline': mutedTextTint,
      '--outline-variant': borderTint,

      '--background': bgTint,
      '--on-background': '#f5f5f7',

      '--zen-bg': bgTint,
      '--zen-surface': cardTint,
      '--zen-surface-hover': hoverTint,
      '--zen-card': cardTint,
      '--zen-border': borderTint,
      '--zen-border-strong': outlineVarTint,
      '--zen-text': '#f5f5f7',
      '--zen-text-muted': mutedTextTint,
      '--zen-accent': selectedHex,
      '--zen-accent-glow': 'transparent', // Glows removed for minimalist zen aesthetic
      '--zen-accent-hover': primaryActiveTint,
      '--zen-accent-subtle': cardTint,
      '--zen-ring': primaryActiveTint,
    };
  } else {
    // Base Tones for LIGHT MODE:
    // Primary Base: White
    // Secondary Base: Grey
    // Accent Base: Dark Black
    const baseWhite = { r: 253, g: 253, b: 254 };
    const baseCard = { r: 255, g: 255, b: 255 };
    const baseSurfaceLow = { r: 247, g: 247, b: 249 };
    const baseSurfaceHigh = { r: 238, g: 238, b: 242 };
    const baseBorder = { r: 226, g: 226, b: 232 };
    const baseMutedText = { r: 100, g: 100, b: 112 };
    const baseBlack = { r: 20, g: 20, b: 26 };

    const bgTint = mixColor(baseWhite, tint, THEME_MIX.primary); // 5% tint
    const cardTint = baseCard ? '#ffffff' : mixColor(baseCard, tint, THEME_MIX.primary);
    const surfaceLowTint = mixColor(baseSurfaceLow, tint, THEME_MIX.primary * 1.5);
    const surfaceHighTint = mixColor(baseSurfaceHigh, tint, THEME_MIX.secondary);
    const borderTint = mixColor(baseBorder, tint, THEME_MIX.secondary);
    const mutedTextTint = mixColor(baseMutedText, tint, THEME_MIX.primary * 2);
    const primaryActiveTint = mixColor(baseBlack, tint, THEME_MIX.accent); // 25% tint

    return {
      '--primary': primaryActiveTint,
      '--on-primary': '#ffffff',
      '--primary-container': surfaceLowTint,
      '--on-primary-container': primaryActiveTint,
      '--primary-fixed': surfaceLowTint,
      '--primary-fixed-dim': surfaceHighTint,

      '--secondary': mutedTextTint,
      '--on-secondary': '#ffffff',
      '--secondary-container': surfaceLowTint,
      '--on-secondary-container': primaryActiveTint,

      '--tertiary': primaryActiveTint,
      '--on-tertiary': '#ffffff',
      '--tertiary-container': surfaceLowTint,
      '--on-tertiary-container': primaryActiveTint,

      '--surface': bgTint,
      '--on-surface': '#14141a',
      '--surface-dim': surfaceLowTint,
      '--surface-bright': '#ffffff',
      '--surface-container-lowest': '#ffffff',
      '--surface-container-low': surfaceLowTint,
      '--surface-container': surfaceHighTint,
      '--surface-container-high': surfaceHighTint,
      '--surface-container-highest': surfaceHighTint,
      '--surface-variant': borderTint,
      '--on-surface-variant': mutedTextTint,

      '--outline': mutedTextTint,
      '--outline-variant': borderTint,

      '--background': bgTint,
      '--on-background': '#14141a',

      '--zen-bg': bgTint,
      '--zen-surface': surfaceLowTint,
      '--zen-surface-hover': surfaceHighTint,
      '--zen-card': cardTint,
      '--zen-border': borderTint,
      '--zen-border-strong': borderTint,
      '--zen-text': '#14141a',
      '--zen-text-muted': mutedTextTint,
      '--zen-accent': selectedHex,
      '--zen-accent-glow': 'transparent', // Glows removed for minimalist zen aesthetic
      '--zen-accent-hover': primaryActiveTint,
      '--zen-accent-subtle': surfaceLowTint,
      '--zen-ring': primaryActiveTint,
    };
  }
}
