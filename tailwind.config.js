/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF0000',    // rojo intenso
        dark: '#111111',       // negro suave
        light: '#1a1a1a',      // gris oscuro
        accent: '#FFD700',     // dorado opcional pa detalles
      },
    },
  },
  plugins: [],
}

