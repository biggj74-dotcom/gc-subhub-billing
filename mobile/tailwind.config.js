/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mirrors the `C` design tokens from the GCSubHub prototype.
        bg: '#0B0C10',
        panel: '#16171C',
        panel2: '#1F2126',
        line: '#2B2D34',
        gold: '#C6A15B',
        goldBright: '#E3C486',
        chrome: '#B8C0CC',
        brand: {
          green: '#4AA57C',
          blue: '#5C82B8',
          red: '#C05B57',
        },
        paper: '#F3F2ED',
        silver: '#888D97',
      },
    },
  },
  plugins: [],
};
