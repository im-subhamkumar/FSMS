/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'go-green': '#00e87a',
        'nogo-red': '#ff3b3b',
        'caution-yellow': '#ffc41a',
        'vfr': '#00d97e',
        'mvfr': '#4da6ff',
        'ifr': '#ff4d4d',
        'lifr': '#b44dff',
        'glass-surface': 'rgba(255, 255, 255, 0.7)',
        'glass-border': 'rgba(58, 127, 255, 0.2)',
      }
    },
  },
  plugins: [],
}
