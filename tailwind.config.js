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
        zen: {
          bg: 'var(--zen-bg)',
          surface: 'var(--zen-surface)',
          'surface-hover': 'var(--zen-surface-hover)',
          card: 'var(--zen-card)',
          border: 'var(--zen-border)',
          'border-strong': 'var(--zen-border-strong)',
          text: 'var(--zen-text)',
          'text-muted': 'var(--zen-text-muted)',
          accent: 'var(--zen-accent)',
          'accent-glow': 'var(--zen-accent-glow)',
          'accent-hover': 'var(--zen-accent-hover)',
          'accent-subtle': 'var(--zen-accent-subtle)',
          ring: 'var(--zen-ring)',
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
