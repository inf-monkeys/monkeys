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
          50: 'color(display-p3 var(--vines-50, 0.929 0.98 0.898) / <alpha-value>)',
          100: 'color(display-p3 var(--vines-100, 0.859 0.965 0.796) / <alpha-value>)',
          200: 'color(display-p3 var(--vines-200, 0.714 0.925 0.592) / <alpha-value>)',
          300: 'color(display-p3 var(--vines-300, 0.573 0.89 0.388) / <alpha-value>)',
          400: 'color(display-p3 var(--vines-400, 0.431 0.855 0.184) / <alpha-value>)',
          500: 'color(display-p3 var(--vines-500, 0.322 0.678 0.122) / <alpha-value>)', // primary
          600: 'color(display-p3 var(--vines-600, 0.259 0.541 0.098) / <alpha-value>)',
          700: 'color(display-p3 var(--vines-700, 0.196 0.408 0.075) / <alpha-value>)',
          800: 'color(display-p3 var(--vines-800, 0.129 0.271 0.047) / <alpha-value>)',
          900: 'color(display-p3 var(--vines-900, 0.067 0.137 0.024) / <alpha-value>)',
          950: 'color(display-p3 var(--vines-950, 0.031 0.067 0.012) / <alpha-value>)',
          dark: {
            50: 'color(display-p3 var(--vines-dark-50, 0.941 0.992 0.914) / <alpha-value>)',
            100: 'color(display-p3 var(--vines-dark-100, 0.875 0.976 0.82) / <alpha-value>)',
            200: 'color(display-p3 var(--vines-dark-200, 0.737 0.937 0.627) / <alpha-value>)',
            300: 'color(display-p3 var(--vines-dark-300, 0.604 0.902 0.431) / <alpha-value>)',
            400: 'color(display-p3 var(--vines-dark-400, 0.471 0.867 0.239) / <alpha-value>)',
            500: 'color(display-p3 var(--vines-dark-500, 0.357 0.69 0.169) / <alpha-value>)', // primary
            600: 'color(display-p3 var(--vines-dark-600, 0.286 0.553 0.137) / <alpha-value>)',
            700: 'color(display-p3 var(--vines-dark-700, 0.22 0.42 0.102) / <alpha-value>)',
            800: 'color(display-p3 var(--vines-dark-800, 0.145 0.282 0.067) / <alpha-value>)',
            900: 'color(display-p3 var(--vines-dark-900, 0.078 0.149 0.035) / <alpha-value>)',
            950: 'color(display-p3 var(--vines-dark-950, 0.039 0.078 0.02) / <alpha-value>)',
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
