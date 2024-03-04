import type { Config } from 'tailwindcss';

import tailwindcss_animate from 'tailwindcss-animate';
import createPlugin from 'windy-radix-palette';
import { nextui } from '@nextui-org/theme';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './node_modules/@nextui-org/theme/dist/components/scroll-shadow.js',
  ],
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
          50: 'rgb(var(--vines-50, 245 245 245) / <alpha-value>)',
          100: 'rgb(var(--vines-100, 220 220 220) / <alpha-value>)',
          200: 'rgb(var(--vines-200, 172 172 172) / <alpha-value>)',
          300: 'rgb(var(--vines-300, 124 124 124) / <alpha-value>)',
          400: 'rgb(var(--vines-400, 76 76 76) / <alpha-value>)',
          500: 'rgb(var(--vines-500, 28 28 28) / <alpha-value>)', // primary
          600: 'rgb(var(--vines-600, 23 23 23) / <alpha-value>)',
          700: 'rgb(var(--vines-700, 19 19 19) / <alpha-value>)',
          800: 'rgb(var(--vines-800, 14 14 14) / <alpha-value>)',
          900: 'rgb(var(--vines-900, 9 9 9) / <alpha-value>)',
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
        tertiary: {
          DEFAULT: 'hsl()',
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
  plugins: [tailwindcss_animate, createPlugin({ opacitySupport: true }).plugin, nextui()],
} satisfies Config;

export default config;
