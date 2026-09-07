/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: 'var(--canvas-bg)',
          surface: 'var(--canvas-surface)',
          'surface-hover': 'var(--canvas-surface-hover)',
          card: 'var(--canvas-card)',
          border: 'var(--canvas-border)',
          'border-strong': 'var(--canvas-border-strong)',
          text: 'var(--canvas-text)',
          'text-muted': 'var(--canvas-text-muted)',
          accent: 'var(--canvas-accent)',
          'accent-glow': 'var(--canvas-accent-glow)',
          'accent-hover': 'var(--canvas-accent-hover)',
          'accent-subtle': 'var(--canvas-accent-subtle)',
          ring: 'var(--canvas-ring)',
        },
        zen: {
          bg: 'var(--canvas-bg)',
          surface: 'var(--canvas-surface)',
          'surface-hover': 'var(--canvas-surface-hover)',
          card: 'var(--canvas-card)',
          border: 'var(--canvas-border)',
          'border-strong': 'var(--canvas-border-strong)',
          text: 'var(--canvas-text)',
          'text-muted': 'var(--canvas-text-muted)',
          accent: 'var(--canvas-accent)',
          'accent-glow': 'var(--canvas-accent-glow)',
          'accent-hover': 'var(--canvas-accent-hover)',
          'accent-subtle': 'var(--canvas-accent-subtle)',
          ring: 'var(--canvas-ring)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit-spin': 'orbitSpin 60s linear infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'ripple': 'ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        orbitSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
