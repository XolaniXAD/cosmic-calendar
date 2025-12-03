/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#208AF3',
        'background-light': '#f0f2f5',
        'background-dark': '#111418',
      },
      fontFamily: {
        display: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-space-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
