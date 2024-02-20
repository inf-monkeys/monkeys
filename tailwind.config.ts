import type { Config } from 'tailwindcss';

import tailwindcss_animate from 'tailwindcss-animate';

const config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        vines: {
          50: 'oklch(var(--vines-50) / <alpha-value>)',
          100: 'oklch(var(--vines-100) / <alpha-value>)',
          200: 'oklch(var(--vines-200) / <alpha-value>)',
          300: 'oklch(var(--vines-300) / <alpha-value>)',
          400: 'oklch(var(--vines-400) / <alpha-value>)',
          500: 'oklch(var(--vines-500) / <alpha-value>)', // primary
          600: 'oklch(var(--vines-600) / <alpha-value>)',
          700: 'oklch(var(--vines-700) / <alpha-value>)',
          800: 'oklch(var(--vines-800) / <alpha-value>)',
          900: 'oklch(var(--vines-900) / <alpha-value>)',
          950: 'oklch(var(--vines-950) / <alpha-value>)',
          dark: {
            50: 'oklch(var(--vines-dark-50) / <alpha-value>)',
            100: 'oklch(var(--vines-dark-100) / <alpha-value>)',
            200: 'oklch(var(--vines-dark-200) / <alpha-value>)',
            300: 'oklch(var(--vines-dark-300) / <alpha-value>)',
            400: 'oklch(var(--vines-dark-400) / <alpha-value>)',
            500: 'oklch(var(--vines-dark-500) / <alpha-value>)', // primary
            600: 'oklch(var(--vines-dark-600) / <alpha-value>)',
            700: 'oklch(var(--vines-dark-700) / <alpha-value>)',
            800: 'oklch(var(--vines-dark-800) / <alpha-value>)',
            900: 'oklch(var(--vines-dark-900) / <alpha-value>)',
            950: 'oklch(var(--vines-dark-950) / <alpha-value>)',
          },
        },
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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
    },
  },
  plugins: [tailwindcss_animate],
} satisfies Config;

export default config;
