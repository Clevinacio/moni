import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      screens: {
        tablet: '720px',
      },
      fontFamily: {
        sans: ['Inter', /* fallback */ 'sans-serif'],
      },
      colors: {
        brand: {
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          light: 'rgb(var(--color-brand-light) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)', // WCAG AA pass text-white
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)', // WCAG AA pass text-white
        },
        alert: {
          DEFAULT: 'rgb(var(--color-alert) / <alpha-value>)', // Para uso com text-brand-dark ou preto
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
