import {
  isolateForComponents,
  scopedPreflightStyles,
} from 'tailwindcss-scoped-preflight';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: 'eb-',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    fontFamily: {
      sans: `var(--eb-font-family) ${defaultTheme.fontFamily.sans.join(', ')}`,
    },
    extend: {
      height: {
        'modal-overflow': 'calc(100% - 25dvh)',
      },
      colors: {
        border: 'hsl(var(--eb-border))',
        input: 'hsl(var(--eb-input))',
        ring: 'hsl(var(--eb-ring))',
        background: 'hsl(var(--eb-background))',
        foreground: 'hsl(var(--eb-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--eb-primary))',
          foreground: 'hsl(var(--eb-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--eb-secondary))',
          foreground: 'hsl(var(--eb-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--eb-destructive))',
          foreground: 'hsl(var(--eb-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--eb-muted))',
          foreground: 'hsl(var(--eb-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--eb-accent))',
          foreground: 'hsl(var(--eb-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--eb-popover))',
          foreground: 'hsl(var(--eb-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--eb-card))',
          foreground: 'hsl(var(--eb-card-foreground))',
        },
      },
      borderRadius: {
        lg: 'calc(var(--eb-radius) + 2px)',
        md: 'var(--eb-radius)',
        sm: 'calc(var(--eb-radius) - 4px)',
        button: 'var(--eb-button-radius)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      zIndex: {
        overlay: 'var(--eb-z-overlay)',
      },
      spacing: {
        ...[
          0.5, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28,
          32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
        ].reduce((acc, n) => {
          acc[n.toString()] = `calc(var(--eb-spacing-interval) * ${n})`;
          return acc;
        }, {}),
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    scopedPreflightStyles({
      isolationStrategy: isolateForComponents('.eb-component'),
    }),
  ],
};
