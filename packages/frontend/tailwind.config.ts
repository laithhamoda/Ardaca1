import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0f4c81',
          700: '#0c3a65',
        },
      },
      fontFamily: {
        english: ['Inter', 'ui-sans-serif', 'system-ui'],
        arabic: ['Noto Kufi Arabic', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 76, 129, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
