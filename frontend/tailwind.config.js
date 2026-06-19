/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm amber morning palette
        dawn: {
          50:  '#fef9f0',
          100: '#fef0d4',
          200: '#fcd99a',
          300: '#f9bc5a',
          400: '#f79f22',
          500: '#e8870a',
          600: '#c86806',
          700: '#a04d08',
          800: '#7f3d0e',
          900: '#68320f',
        },
        charcoal: {
          50:  '#f6f5f4',
          100: '#e8e5e3',
          200: '#d2cdc8',
          300: '#b4aba3',
          400: '#938880',
          500: '#786e66',
          600: '#625a53',
          700: '#514b45',
          800: '#44403b',
          900: '#1c1a18',
          950: '#0f0e0c',
        },
        cream: '#fdfaf5',
      },
      fontFamily: {
        display: ['"Noto Serif TC"', 'Georgia', 'serif'],
        body: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
