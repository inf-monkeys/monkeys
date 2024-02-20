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
          50: 'oklch(var(--vines-50, 97.06% 0.06 134.04) / <alpha-value>)',
          100: 'oklch(var(--vines-100, 93.91% 0.133 134.55) / <alpha-value>)',
          200: 'oklch(var(--vines-200, 87.82% 0.25 137.15) / <alpha-value>)',
          300: 'oklch(var(--vines-300, 81.65% 0.251 138.42) / <alpha-value>)',
          400: 'oklch(var(--vines-400, 74.56% 0.224 137.98) / <alpha-value>)',
          500: 'oklch(var(--vines-500, 66.57% 0.191 137.38) / <alpha-value>)', // primary
          600: 'oklch(var(--vines-600, 64.27% 0.192 137.85) / <alpha-value>)',
          700: 'oklch(var(--vines-700, 63.22% 0.193 138.3) / <alpha-value>)',
          800: 'oklch(var(--vines-800, 60.79% 0.189 138.56) / <alpha-value>)',
          900: 'oklch(var(--vines-900, 58.7% 0.184 138.74) / <alpha-value>)',
          950: 'oklch(var(--vines-950, 57.25% 0.179 138.73) / <alpha-value>)',
          dark: {
            50: 'oklch(var(--vines-dark-50, 97.27% 0.056 133.92) / <alpha-value>)',
            100: 'oklch(var(--vines-dark-100, 94.35% 0.123 134.22) / <alpha-value>)',
            200: 'oklch(var(--vines-dark-200, 89.09% 0.24 136.75) / <alpha-value>)',
            300: 'oklch(var(--vines-dark-300, 82.86% 0.246 137.72) / <alpha-value>)',
            400: 'oklch(var(--vines-dark-400, 75.76% 0.218 137.42) / <alpha-value>)',
            500: 'oklch(var(--vines-dark-500, 67.81% 0.184 136.83) / <alpha-value>)', // primary
            600: 'oklch(var(--vines-dark-600, 65.47% 0.187 137.2) / <alpha-value>)',
            700: 'oklch(var(--vines-dark-700, 64.41% 0.189 137.65) / <alpha-value>)',
            800: 'oklch(var(--vines-dark-800, 61.96% 0.186 137.82) / <alpha-value>)',
            900: 'oklch(var(--vines-dark-900, 59.87% 0.181 138.02) / <alpha-value>)',
            950: 'oklch(var(--vines-dark-950, 58.39% 0.176 138.15) / <alpha-value>)',
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
