---
name: Crimson Zen
colors:
  surface: '#fff8f7'
  surface-dim: '#e1d8d8'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf1f1'
  surface-container: '#f5ecec'
  surface-container-high: '#f0e6e6'
  surface-container-highest: '#eae0e0'
  on-surface: '#1f1b1b'
  on-surface-variant: '#514342'
  inverse-surface: '#342f30'
  inverse-on-surface: '#f8eeee'
  outline: '#847372'
  outline-variant: '#d6c2c0'
  surface-tint: '#84504e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#34100f'
  on-primary-container: '#ae7572'
  inverse-primary: '#f8b6b2'
  secondary: '#a53937'
  on-secondary: '#ffffff'
  secondary-container: '#fe7c75'
  on-secondary-container: '#721317'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e030a'
  on-tertiary-container: '#c46a6a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#f8b6b2'
  on-primary-fixed: '#34100f'
  on-primary-fixed-variant: '#693a38'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ae'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#852222'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b2'
  on-tertiary-fixed: '#3e030a'
  on-tertiary-fixed-variant: '#782f31'
  background: '#fff8f7'
  on-background: '#1f1b1b'
  surface-variant: '#eae0e0'
  surface-bone: '#FFF5F5'
  deep-crimson: '#1A0505'
  rose-ash: '#B39292'
  divider-red: rgba(45, 10, 10, 0.08)
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.02em
  timer-display:
    fontFamily: Inter
    fontSize: 80px
    fontWeight: '300'
    lineHeight: '1.0'
    letterSpacing: -0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 80px
  gutter: 24px
  margin-desktop: 80px
---

## Brand & Style

This design system evolves the "Digital Stillness" philosophy into a monochromatic, high-intent environment. By moving away from sterile neutrals into a deep red spectrum, the UI creates a "darkroom" effect—highly focused, protective of circadian rhythms, and intellectually stimulating.

The style is **Sophisticated Minimalism**. It replaces the concept of "white" with a bone-rose tint and "black" with a bruised crimson. This palette shift transforms the user experience from a generic professional tool into a curated, premium sanctuary for deep thought. The emotional goal is to evoke a sense of "Red Zen"—a state of calm alertness where the warmth of the background reduces eye strain and the depth of the text commands absolute focus.

## Colors

The color strategy is strictly monochromatic, utilizing red as both a functional and emotional anchor.

- **Foundations:** The primary canvas uses `#FFF5F5` (Surface Bone). Elevated surfaces use `#FFFFFF` with a subtle rose-tinted border to maintain layering without introducing new hues.
- **Typography:** All primary text is set in `#1A0505` (Deep Crimson). This provides the necessary contrast of black while maintaining the warmth of the red spectrum. Secondary metadata uses `#8B2626` at reduced opacities.
- **Accents:** Instead of multi-color status indicators, variety is achieved through saturation. High-priority items use vibrant crimson, while passive states use a desaturated Rose Ash.
- **Interactive States:** Hover states use a 5% opacity of the primary crimson, creating a "blush" effect on interactive elements.

## Typography

This system continues to rely on **Inter** for its systematic precision, but the monochromatic color application makes weight and leading even more critical for hierarchy.

- **High-Contrast Reading:** Ensure all body text uses the Deep Crimson color to maintain a minimum 4.5:1 contrast ratio against the bone-rose background.
- **Visual Breathing Room:** The 1.6 line height for body text is a hard requirement to prevent the warm color palette from feeling heavy or "muddy."
- **Display Weights:** Use the 300 weight for Large Timers to keep the interface feeling ethereal.

## Layout & Spacing

The layout remains a **Centered Content Model** to promote singular focus.

- **Grid:** 12-column desktop grid with substantial 80px side margins to "squeeze" content into the center, mimicking a page in an art book.
- **Rhythm:** A strict 4px base unit ensures mathematical harmony. Use `xl` (40px) spacing to separate major content blocks, creating a sense of "Breathability."
- **Containment:** Elements should never touch the edges of their containers. Always apply a minimum `lg` (24px) padding to cards to preserve the minimalist scale.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** and extremely soft red-tinted shadows.

- **Tonal Hierarchy:** The background is `#FFF5F5`. Surface cards are `#FFFFFF`. This subtle shift creates depth without requiring heavy borders.
- **Shadow Character:** Shadows use the primary crimson hue at very low opacity: `0px 4px 20px rgba(45, 10, 10, 0.04)`. This prevents the "gray smudge" effect and keeps the palette pure.
- **Borders:** Use 1px solid borders in `divider-red` (8% Crimson) to define structural boundaries.

## Shapes

The shape language is **Rounded (8px)**, providing a soft counterpoint to the intensity of the red palette.

- **Standard Radius:** 0.5rem (8px) for buttons, inputs, and small modules.
- **Container Radius:** 1rem (16px) for main cards and content wrappers.
- **Pills:** Used for status badges and the primary "Start" action to indicate they are floating, dynamic elements.

## Components

- **Buttons:** 
  - *Primary:* Solid Deep Crimson background with Bone-Rose text.
  - *Secondary:* Transparent background with a 1px Deep Crimson border.
  - *Ghost:* Crimson text that gains a 5% red tint background on hover.
- **Input Fields:** Bottom-border-only design. The border is a light red-gray, transitioning to a solid 2px Crimson stroke on focus.
- **Cards:** White background, 1px Rose-Ash border, 16px radius. Use the ambient red shadow for active states.
- **Chips:** Pill-shaped with a light rose background (`#FFEAEA`) and Deep Crimson text.
- **Timers:** Large, light-weight numbers in Deep Crimson. The progress ring should be a 2px stroke in a mid-tone red, animating smoothly without stepping.
- **Motion:** Transitions use a slow 400ms duration with a "Cubic Bezier (0.4, 0, 0.2, 1)" easing to reinforce the "Zen" atmosphere.