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
        'bg-primary': '#0a0a0b',
        'bg-secondary': '#141416',
        'bg-tertiary': '#1a1a1d',
        'bg-hover': '#242429',
        'border-color': '#2a2a2f',
        'text-primary': '#e5e5e7',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
      },
    },
  },
  plugins: [],
}