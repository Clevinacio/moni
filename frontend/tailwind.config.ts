import type { Config } from 'tailwindcss';

export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', /* fallback */ 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#355872',
          DEFAULT: '#7aaace', // acessado via bg-brand, text-brand, etc
          light: '#9cd5ff',
        },
        background: '#f7f8f0',
        success: {
          DEFAULT: '#4a7c59', // WCAG AA pass text-white
        },
        error: {
          DEFAULT: '#b84a4a', // WCAG AA pass text-white
        },
        alert: {
          DEFAULT: '#d9a05b', // Para uso com text-brand-dark ou preto
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
