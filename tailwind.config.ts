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
          50: 'oklch(97.44% 0.034 142.62 / <alpha-value>)',
          100: 'oklch(94.64% 0.059 141.36 / <alpha-value>)',
          200: 'oklch(90.09% 0.097 141.29 / <alpha-value>)',
          300: 'oklch(84.05% 0.13 141.12 / <alpha-value>)',
          400: 'oklch(77.09% 0.159 141.14 / <alpha-value>)',
          500: 'oklch(70.02% 0.151 140.95 / <alpha-value>)', // primary
          600: 'oklch(67.03% 0.18 141.05 / <alpha-value>)',
          700: 'oklch(64.64% 0.185 141.1 / <alpha-value>)',
          800: 'oklch(63.16% 0.191 141.32 / <alpha-value>)',
          900: 'oklch(59.21% 0.186 141.43 / <alpha-value>)',
          950: 'oklch(58.72% 0.19 141.56 / <alpha-value>)',
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
