/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Amplitude', 'Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // JP Morgan Brand Colors with updated brown primary
        'jpm-blue': {
          DEFAULT: '#1c2752',
          50: '#f0f2f8',
          100: '#e1e6f1',
          200: '#c3cde3',
          300: '#a4b3d5',
          400: '#869ac7',
          500: '#6781b9',
          600: '#4c67a0',
          700: '#3a5082',
          800: '#283964',
          900: '#1c2752',
        },
        'jpm-brown': {
          DEFAULT: '#936846',
          50: '#faf8f6',
          100: '#f4efea',
          200: '#e8ddd0',
          300: '#dbc7b1',
          400: '#c9a985',
          500: '#b8916a',
          600: '#936846',
          700: '#7a553b',
          800: '#654632',
          900: '#543b2b',
        },
        'jpm-gray': {
          DEFAULT: '#6b7280',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'jpm-white': '#ffffff',
        // Update convenience colors to use brown instead of teal
        'jpm-teal': '#936846', // Legacy fallback
        'jpm-teal-100': '#e8ddd0',
        'jpm-teal-600': '#7a553b',
        'jpm-gray-100': '#f3f4f6',
        'jpm-gray-200': '#e5e7eb',
        'jpm-gray-300': '#d1d5db',
        'jpm-gray-900': '#111827',

        // SampleDashboard color scheme for sellsense
        sellsense: {
          secondary: '#2CB9AC',
          'secondary-bg': '#f0fffd',
          primary: '#f55727',
          'primary-bg': '#fff4e6',
          success: '#22A06B',
          warning: '#F0A03C',
          error: '#E53E3E',
          'background-light': '#F8FAFC',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'page-sm': '0.25rem',
        'page-md': '0.375rem',
        'page-lg': '0.5rem',
      },
      fontSize: {
        'page-small': ['0.875rem', { lineHeight: '1.25rem' }],
        'page-body': ['1rem', { lineHeight: '1.5rem' }],
        'page-h4': ['1.125rem', { lineHeight: '1.75rem' }],
        'page-h3': ['1.25rem', { lineHeight: '1.75rem' }],
        'page-h2': ['1.875rem', { lineHeight: '2.25rem' }],
        'page-hero': ['3rem', { lineHeight: '1.2' }],
      },
      boxShadow: {
        'page-card':
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
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
    },
  },
  plugins: [require('tailwindcss-animate')],
};
