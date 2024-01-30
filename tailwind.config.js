/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
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
      },
    },
  },
  plugins: [],
};
