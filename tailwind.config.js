/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pet-bg':     '#000000',
        'pet-card':   '#111111',
        'pet-card-2': '#181818',
        'pet-border': '#222222',
        'pet-pink':   '#FF2D9B',
        'pet-cyan':   '#00E5FF',
        'pet-yellow': '#FFE600',
        'pet-green':  '#00F5A0',
        /* kept for backward compatibility */
        'pet-purple':       '#FF2D9B',
        'pet-purple-light': '#00E5FF',
      },
    },
  },
  plugins: [],
}
