/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta institucional UPN: Lúcuma #FFB800 (acento / llamadas a la acción) y Negro #000000 (estructura).
        // "teal" es el color de acento usado en toda la app: se redefine con el lúcuma.
        teal: {
          50: '#fffaeb',
          100: '#fff0c2',
          200: '#ffe185',
          300: '#ffd04d',
          400: '#ffc21f',
          500: '#ffb800',
          600: '#d99700',
          700: '#a67300',
          800: '#7a5500',
          900: '#5c4000',
          950: '#332300',
        },
        // Superficies en negro neutro (tonos oscuros de "slate" reemplazados por negros UPN).
        slate: {
          700: '#2e2e2e',
          800: '#1c1c1c',
          900: '#0d0d0d',
          950: '#000000',
        },
        brand: { lucuma: '#ffb800', black: '#000000' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
