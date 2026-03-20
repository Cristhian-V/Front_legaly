/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Podrías añadir el azul corporativo de Legaly aquí
        'legal-blue': '#1e3a8a', 
      },
    },
  },
  plugins: [],
}