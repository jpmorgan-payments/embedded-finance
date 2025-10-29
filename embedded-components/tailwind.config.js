import {
  isolateInsideOfContainer,
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
      sans: ['var(--eb-font-family)', ...defaultTheme.fontFamily.sans],
      header: ['var(--eb-header-font-family)', ...defaultTheme.fontFamily.sans],
      button: ['var(--eb-button-font-family)', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      height: {
        'modal-overflow': 'calc(100% - 25dvh)',
      },
      colors: {
        border: 'hsl(var(--eb-border))',
        input: 'hsl(var(--eb-input))',
        inputBorder: 'hsl(var(--eb-input-border))',
        ring: 'hsl(var(--eb-ring))',
        background: 'hsl(var(--eb-background))',
        foreground: 'hsl(var(--eb-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--eb-primary))',
          hover: 'hsl(var(--eb-primary-hover))',
          active: 'hsl(var(--eb-primary-active, var(--eb-primary-hover)))',
          foreground: {
            DEFAULT: 'hsl(var(--eb-primary-foreground))',
            hover:
              'hsl(var(--eb-primary-foreground-hover, var(--eb-primary-foreground)))',
            active:
              'hsl(var(--eb-primary-foreground-active, var(--eb-primary-foreground)))',
          },
        },
        secondary: {
          DEFAULT: 'hsl(var(--eb-secondary))',
          hover: 'hsl(var(--eb-secondary-hover))',
          active: 'hsl(var(--eb-secondary-active, var(--eb-secondary-hover)))',
          foreground: {
            DEFAULT: 'hsl(var(--eb-secondary-foreground))',
            hover:
              'hsl(var(--eb-secondary-foreground-hover, var(--eb-secondary-foreground)))',
            active:
              'hsl(var(--eb-secondary-foreground-active, var(--eb-secondary-foreground)))',
          },
        },
        destructive: {
          DEFAULT: 'hsl(var(--eb-destructive))',
          accent: 'hsl(var(--eb-destructive-accent))',
          hover: 'hsl(var(--eb-destructive-hover))',
          active:
            'hsl(var(--eb-destructive-active, var(--eb-destructive-hover)))',
          foreground: {
            DEFAULT: 'hsl(var(--eb-destructive-foreground))',
            hover:
              'hsl(var(--eb-destructive-foreground-hover, var(--eb-destructive-foreground)))',
            active:
              'hsl(var(--eb-destructive-foreground-active, var(--eb-destructive-foreground)))',
          },
        },
        informative: {
          DEFAULT: 'hsl(var(--eb-informative))',
          accent: 'hsl(var(--eb-informative-accent))',
        },
        warning: {
          DEFAULT: 'hsl(var(--eb-warning))',
          accent: 'hsl(var(--eb-warning-accent))',
        },
        success: {
          DEFAULT: 'hsl(var(--eb-success))',
          accent: 'hsl(var(--eb-success-accent))',
        },
        metric: {
          DEFAULT: 'hsl(var(--eb-metric-accent))',
          accent: 'hsl(var(--eb-metric-accent))',
        },
        muted: {
          DEFAULT: 'hsl(var(--eb-muted))',
          foreground: 'hsl(var(--eb-muted-foreground))',
        },
        label: {
          foreground: 'hsl(var(--eb-form-label-foreground))',
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
        alert: {
          DEFAULT: 'hsl(var(--eb-alert))',
          foreground: 'hsl(var(--eb-alert-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--eb-sidebar-background))',
          foreground: 'hsl(var(--eb-sidebar-foreground))',
          accent: 'hsl(var(--eb-sidebar-accent))',
          'accent-foreground': 'hsl(var(--eb-sidebar-accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'calc(var(--eb-radius) + 2px)',
        md: 'var(--eb-radius)',
        sm: 'calc(var(--eb-radius) - 4px)',
        button: 'var(--eb-button-radius)',
        input: 'var(--eb-input-radius)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
      },
      zIndex: {
        overlay: 'var(--eb-z-overlay)',
      },
      spacing: {
        ...[
          0.25, 0.5, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
          24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
        ].reduce((acc, n) => {
          acc[n.toString()] = `calc(var(--eb-spacing-unit) * ${n})`;
          return acc;
        }, {}),
      },
      fontSize: {
        button: ['var(--eb-button-font-size)', 'var(--eb-button-line-height)'],
        label: [
          'var(--eb-form-label-font-size)',
          'var(--eb-form-label-line-height)',
        ],
      },
      fontWeight: {
        'button-primary': 'var(--eb-button-primary-font-weight)',
        'button-secondary': 'var(--eb-button-secondary-font-weight)',
        'button-destructive': 'var(--eb-button-destructive-font-weight)',
        label: 'var(--eb-form-label-font-weight)',
      },
      boxShadow: {
        'border-primary':
          'inset 0 0 0 var(--eb-primary-border-width) var(--tw-shadow-color)',
        'border-secondary':
          'inset 0 0 0 var(--eb-secondary-border-width) var(--tw-shadow-color)',
        'border-destructive':
          'inset 0 0 0 var(--eb-destructive-border-width) var(--tw-shadow-color)',
      },
      letterSpacing: {
        button: 'var(--eb-button-letter-spacing)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/container-queries'),
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.eb-component', {
        rootStyles: 'add :where',
      }),
    }),
    ({ addUtilities }) => {
      addUtilities({
        '.button-padding': {
          // padding: 'var(--eb-button-padding)',
        },
        '.button-text-transform': {
          textTransform: 'var(--eb-button-text-transform)',
        },
      });
    },
  ],
};
