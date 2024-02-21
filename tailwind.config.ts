import type { Config } from 'tailwindcss';

import tailwindcss_animate from 'tailwindcss-animate';
import createPlugin from 'windy-radix-palette';

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
          50: 'color(display-p3 var(--vines-50, 0.898 1 0.839) / <alpha-value>)',
          100: 'color(display-p3 var(--vines-100, 0.773 1 0.639) / <alpha-value>)',
          200: 'color(display-p3 var(--vines-200, 0.486 0.98 0.2) / <alpha-value>)',
          300: 'color(display-p3 var(--vines-300, 0.898 1 0.839) / <alpha-value>)',
          400: 'color(display-p3 var(--vines-400, 0.345 0.796 0.086) / <alpha-value>)',
          500: 'color(display-p3 var(--vines-500, 0.322 0.678 0.122) / <alpha-value>)', // primary
          600: 'color(display-p3 var(--vines-600, 0.282 0.651 0.071) / <alpha-value>)',
          700: 'color(display-p3 var(--vines-700, 0.259 0.639 0.043) / <alpha-value>)',
          800: 'color(display-p3 var(--vines-800, 0.231 0.608 0.012) / <alpha-value>)',
          900: 'color(display-p3 var(--vines-900, 0.212 0.58 0) / <alpha-value>)',
          950: 'color(display-p3 var(--vines-950, 0.204 0.561 0) / <alpha-value>)',
          dark: {
            50: 'color(display-p3 var(--vines-dark-50, 0.906 1 0.851) / <alpha-value>)',
            100: 'color(display-p3 var(--vines-dark-100, 0.792 1 0.667) / <alpha-value>)',
            200: 'color(display-p3 var(--vines-dark-200, 0.529 0.992 0.267) / <alpha-value>)',
            300: 'color(display-p3 var(--vines-dark-300, 0.416 0.914 0.129) / <alpha-value>)',
            400: 'color(display-p3 var(--vines-dark-400, 0.384 0.808 0.145) / <alpha-value>)',
            500: 'color(display-p3 var(--vines-dark-500, 0.357 0.69 0.169) / <alpha-value>)', // primary
            600: 'color(display-p3 var(--vines-dark-600, 0.318 0.663 0.118) / <alpha-value>)',
            700: 'color(display-p3 var(--vines-dark-700, 0.294 0.651 0.094) / <alpha-value>)',
            800: 'color(display-p3 var(--vines-dark-800, 0.267 0.62 0.059) / <alpha-value>)',
            900: 'color(display-p3 var(--vines-dark-900, 0.247 0.592 0.047) / <alpha-value>)',
            950: 'color(display-p3 var(--vines-dark-950, 0.235 0.573 0.047) / <alpha-value>)',
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
  plugins: [tailwindcss_animate, createPlugin({ opacitySupport: true }).plugin],
} satisfies Config;

export default config;
