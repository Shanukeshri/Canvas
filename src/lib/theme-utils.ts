import { ThemeColor } from "@/types";

// Central theme mix percentages as defined in theme.txt
// Tuned for richer user color presence while keeping a minimalist zen aesthetic
export const THEME_MIX = {
  primary: 0.08, // 8% tint on base background / canvas / cards
  secondary: 0.16, // 16% tint on secondary surfaces / cards / borders
  accent: 0.45, // 45% tint on accent / active elements / text
};

// 24 Predefined Harmonious Themes
export const PRESET_THEMES: ThemeColor[] = [
  {
    id: "ethereal-aqua",
    name: "Ethereal Aqua",
    hex: "#0D9488",
    hsl: { h: 175, s: 84, l: 32 },
  },
  {
    id: "crimson",
    name: "Crimson",
    hex: "#8B1E1E",
    hsl: { h: 0, s: 64, l: 33 },
  },
  {
    id: "rose",
    name: "Rose Ash",
    hex: "#B35D72",
    hsl: { h: 345, s: 36, l: 53 },
  },
  {
    id: "ruby",
    name: "Ruby Focus",
    hex: "#C52233",
    hsl: { h: 354, s: 71, l: 45 },
  },
  {
    id: "coral",
    name: "Warm Coral",
    hex: "#E05A47",
    hsl: { h: 7, s: 73, l: 58 },
  },
  {
    id: "amber",
    name: "Zen Amber",
    hex: "#D97706",
    hsl: { h: 32, s: 95, l: 44 },
  },
  {
    id: "gold",
    name: "Solar Gold",
    hex: "#CA8A04",
    hsl: { h: 42, s: 94, l: 40 },
  },
  {
    id: "emerald",
    name: "Emerald Mind",
    hex: "#059669",
    hsl: { h: 160, s: 84, l: 31 },
  },
  {
    id: "sage",
    name: "Quiet Sage",
    hex: "#4D7C0F",
    hsl: { h: 84, s: 85, l: 27 },
  },
  {
    id: "teal",
    name: "Deep Teal",
    hex: "#0D9488",
    hsl: { h: 175, s: 84, l: 32 },
  },
  {
    id: "cyan",
    name: "Minimal Cyan",
    hex: "#0891B2",
    hsl: { h: 192, s: 91, l: 36 },
  },
  {
    id: "sky",
    name: "Serene Sky",
    hex: "#0284C7",
    hsl: { h: 201, s: 98, l: 39 },
  },
  {
    id: "sapphire",
    name: "Royal Sapphire",
    hex: "#2563EB",
    hsl: { h: 221, s: 83, l: 53 },
  },
  {
    id: "indigo",
    name: "Midnight Indigo",
    hex: "#4F46E5",
    hsl: { h: 244, s: 75, l: 59 },
  },
  {
    id: "violet",
    name: "Cosmic Violet",
    hex: "#7C3AED",
    hsl: { h: 263, s: 84, l: 58 },
  },
  {
    id: "amethyst",
    name: "Deep Amethyst",
    hex: "#9333EA",
    hsl: { h: 271, s: 81, l: 56 },
  },
  {
    id: "orchid",
    name: "Soft Orchid",
    hex: "#C026D3",
    hsl: { h: 293, s: 69, l: 49 },
  },
  {
    id: "magenta",
    name: "Vibrant Magenta",
    hex: "#DB2777",
    hsl: { h: 330, s: 79, l: 51 },
  },
  {
    id: "charcoal",
    name: "Slate Charcoal",
    hex: "#475569",
    hsl: { h: 215, s: 19, l: 35 },
  },
  {
    id: "copper",
    name: "Rustic Copper",
    hex: "#B45309",
    hsl: { h: 26, s: 90, l: 37 },
  },
  {
    id: "bronze",
    name: "Muted Bronze",
    hex: "#78350F",
    hsl: { h: 22, s: 78, l: 26 },
  },
  {
    id: "olive",
    name: "Peaceful Olive",
    hex: "#65A30D",
    hsl: { h: 84, s: 80, l: 35 },
  },
  {
    id: "clay",
    name: "Terracotta Clay",
    hex: "#A16207",
    hsl: { h: 36, s: 88, l: 33 },
  },
  {
    id: "monochrome",
    name: "Pure Obsidian",
    hex: "#52525B",
    hsl: { h: 240, s: 5, l: 34 },
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
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

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lum = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lum - c / 2;

  let rPrime = 0,
    gPrime = 0,
    bPrime = 0;
  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Mixes a base RGB color with a tint RGB color by a given weight factor (0.0 to 1.0).
 */
export function mixColor(
  base: { r: number; g: number; b: number },
  tint: { r: number; g: number; b: number },
  weight: number,
): string {
  const r = Math.round(base.r * (1 - weight) + tint.r * weight);
  const g = Math.round(base.g * (1 - weight) + tint.g * weight);
  const b = Math.round(base.b * (1 - weight) + tint.b * weight);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Centrally derives all minimalist UI theme variables from base tones (White/Grey/Black)
 * mixed with the user's selected accent color.
 * Colored/tinted white is consistently applied to canvas backgrounds, cards, overlays, and modals.
 */
export function generateThemeCssVariables(
  selectedHex: string,
  isDarkMode: boolean,
): Record<string, string> {
  const tint = hexToRgb(selectedHex);

  if (isDarkMode) {
    // Base Tones for DARK MODE:
    // Primary Base: Black
    // Secondary Base: Dark Grey
    // Accent Base: Crisp White
    const baseBlack = { r: 10, g: 10, b: 13 };
    const baseCard = { r: 18, g: 18, b: 23 };
    const baseSurfaceHigh = { r: 26, g: 26, b: 32 };
    const baseBorder = { r: 42, g: 42, b: 50 };
    const baseOutlineVariant = { r: 58, g: 58, b: 68 };
    const baseMutedText = { r: 165, g: 165, b: 178 };
    const baseWhite = { r: 248, g: 248, b: 250 };

    // Richer percentage mixing
    const bgTint = mixColor(baseBlack, tint, THEME_MIX.primary); // 8% tint
    const cardTint = mixColor(baseCard, tint, THEME_MIX.secondary); // 16% tint
    const hoverTint = mixColor(
      baseSurfaceHigh,
      tint,
      THEME_MIX.secondary * 1.2,
    );
    const borderTint = mixColor(baseBorder, tint, THEME_MIX.secondary);
    const outlineVarTint = mixColor(
      baseOutlineVariant,
      tint,
      THEME_MIX.secondary,
    );
    const mutedTextTint = mixColor(baseMutedText, tint, THEME_MIX.secondary);
    const primaryActiveTint = mixColor(baseWhite, tint, THEME_MIX.accent); // 45% tint
    const timerDigitsTint = mixColor(baseWhite, tint, 0.5); // 50% tint for timer digits
    const timerSurfaceTint = mixColor(baseCard, tint, 0.22); // 22% tint for timer disc

    return {
      "--primary": primaryActiveTint,
      "--on-primary": "#0a0a0c",
      "--primary-container": cardTint,
      "--on-primary-container": primaryActiveTint,
      "--primary-fixed": primaryActiveTint,
      "--primary-fixed-dim": primaryActiveTint,

      "--secondary": mutedTextTint,
      "--on-secondary": "#0a0a0c",
      "--secondary-container": cardTint,
      "--on-secondary-container": primaryActiveTint,

      "--tertiary": primaryActiveTint,
      "--on-tertiary": "#0a0a0c",
      "--tertiary-container": cardTint,
      "--on-tertiary-container": primaryActiveTint,

      "--surface": bgTint,
      "--on-surface": "#f5f5f7",
      "--surface-dim": bgTint,
      "--surface-bright": hoverTint,
      "--surface-container-lowest": bgTint,
      "--surface-container-low": cardTint,
      "--surface-container": hoverTint,
      "--surface-container-high": hoverTint,
      "--surface-container-highest": hoverTint,
      "--surface-variant": borderTint,
      "--on-surface-variant": mutedTextTint,

      "--outline": mutedTextTint,
      "--outline-variant": borderTint,

      "--background": bgTint,
      "--on-background": "#f5f5f7",

      "--zen-bg": bgTint,
      "--zen-surface": cardTint,
      "--zen-surface-hover": hoverTint,
      "--zen-card": cardTint,
      "--zen-border": borderTint,
      "--zen-border-strong": outlineVarTint,
      "--zen-text": "#f5f5f7",
      "--zen-text-muted": mutedTextTint,
      "--zen-accent": selectedHex,
      "--zen-accent-glow": "transparent",
      "--zen-accent-hover": primaryActiveTint,
      "--zen-accent-subtle": cardTint,
      "--zen-ring": primaryActiveTint,

      "--timer-accent": selectedHex,
      "--timer-digits": timerDigitsTint,
      "--timer-surface": timerSurfaceTint,
    };
  } else {
    // Base Tones for LIGHT MODE:
    // Primary Base: White (tinted canvas and card surfaces)
    // Secondary Base: Grey (surfaces, borders, muted text) - mixed with 15% more saturated color tint
    // Accent Base: Dark Black (primary active elements, timer digits) - mixed with 15% more saturated color tint
    const baseHsl = hexToHsl(selectedHex);
    const greyBlackSaturatedHsl = {
      h: baseHsl.h,
      s: Math.min(100, baseHsl.s + 15),
      l: baseHsl.l,
    };
    const saturatedTint = hslToRgb(
      greyBlackSaturatedHsl.h,
      greyBlackSaturatedHsl.s,
      greyBlackSaturatedHsl.l,
    );

    const baseWhite = { r: 252, g: 252, b: 254 };
    const baseCard = { r: 255, g: 255, b: 255 };
    const baseSurfaceLow = { r: 245, g: 245, b: 248 };
    const baseSurfaceHigh = { r: 236, g: 236, b: 242 };
    const baseBorder = { r: 222, g: 222, b: 230 };
    const baseMutedText = { r: 90, g: 90, b: 105 };
    const baseBlack = { r: 18, g: 18, b: 24 };

    // Colored white tints
    const bgTint = mixColor(baseWhite, tint, THEME_MIX.primary); // 8% colored white tint for canvas
    const cardTint = mixColor(baseCard, tint, THEME_MIX.primary); // 8% colored white tint for cards, overlays, modals
    const surfaceLowTint = mixColor(baseSurfaceLow, saturatedTint, THEME_MIX.secondary);
    const surfaceHighTint = mixColor(
      baseSurfaceHigh,
      saturatedTint,
      THEME_MIX.secondary * 1.2,
    );
    const borderTint = mixColor(baseBorder, saturatedTint, THEME_MIX.secondary);
    const mutedTextTint = mixColor(baseMutedText, saturatedTint, THEME_MIX.secondary);
    const primaryActiveTint = mixColor(baseBlack, saturatedTint, THEME_MIX.accent); // 45% tint
    const timerDigitsTint = mixColor(baseBlack, saturatedTint, 0.55); // 55% tint for timer digits
    const timerSurfaceTint = mixColor(baseSurfaceLow, saturatedTint, 0.2);

    return {
      "--primary": primaryActiveTint,
      "--on-primary": "#ffffff",
      "--primary-container": surfaceLowTint,
      "--on-primary-container": primaryActiveTint,
      "--primary-fixed": surfaceLowTint,
      "--primary-fixed-dim": surfaceHighTint,

      "--secondary": mutedTextTint,
      "--on-secondary": "#ffffff",
      "--secondary-container": surfaceLowTint,
      "--on-secondary-container": primaryActiveTint,

      "--tertiary": primaryActiveTint,
      "--on-tertiary": "#ffffff",
      "--tertiary-container": surfaceLowTint,
      "--on-tertiary-container": primaryActiveTint,

      "--surface": bgTint,
      "--on-surface": "#14141a",
      "--surface-dim": surfaceLowTint,
      "--surface-bright": cardTint,
      "--surface-container-lowest": cardTint,
      "--surface-container-low": surfaceLowTint,
      "--surface-container": surfaceHighTint,
      "--surface-container-high": surfaceHighTint,
      "--surface-container-highest": surfaceHighTint,
      "--surface-variant": borderTint,
      "--on-surface-variant": mutedTextTint,

      "--outline": mutedTextTint,
      "--outline-variant": borderTint,

      "--background": bgTint,
      "--on-background": "#14141a",

      "--zen-bg": bgTint,
      "--zen-surface": surfaceLowTint,
      "--zen-surface-hover": surfaceHighTint,
      "--zen-card": cardTint,
      "--zen-border": borderTint,
      "--zen-border-strong": borderTint,
      "--zen-text": "#14141a",
      "--zen-text-muted": mutedTextTint,
      "--zen-accent": selectedHex,
      "--zen-accent-glow": "transparent",
      "--zen-accent-hover": primaryActiveTint,
      "--zen-accent-subtle": surfaceLowTint,
      "--zen-ring": primaryActiveTint,

      "--timer-accent": selectedHex,
      "--timer-digits": timerDigitsTint,
      "--timer-surface": timerSurfaceTint,
    };
  }
}
