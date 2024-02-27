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
          50: 'rgb(var(--vines-50, 238 247 231) / <alpha-value>)',
          100: 'rgb(var(--vines-100, 216 239 199) / <alpha-value>)',
          200: 'rgb(var(--vines-200, 179 222 149) / <alpha-value>)',
          300: 'rgb(var(--vines-300, 144 206 104) / <alpha-value>)',
          400: 'rgb(var(--vines-400, 112 189 65) / <alpha-value>)',
          500: 'rgb(var(--vines-500, 82 173 31) / <alpha-value>)', // primary
          600: 'rgb(var(--vines-600, 65 144 24) / <alpha-value>)',
          700: 'rgb(var(--vines-700, 50 115 18) / <alpha-value>)',
          800: 'rgb(var(--vines-800, 36 87 13) / <alpha-value>)',
          900: 'rgb(var(--vines-900, 23 58 8) / <alpha-value>)',
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
