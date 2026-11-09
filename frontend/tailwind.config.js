/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          clay: '#c2410c',
          clayLight: '#ea580c',
          clayDark: '#9a3412',
        },
        // Custom extended slate stops referenced in components
        slate: {
          850: '#172033', // between 800 (#1e293b) and 900 (#0f172a)
          150: '#eaf0f6', // between 100 and 200
          350: '#b3c0d1', // between 300 and 400
          450: '#7a8fa3', // between 400 and 500
          650: '#3d5166', // between 600 and 700
        },
        red: {
          650: '#dc2626', // same as red-600, ensures class resolves
        }
      },
      fontFamily: {
        serif: ['Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
