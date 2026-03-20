/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#005da0",
          deep: "#002b4d",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #005da0, 0 0 10px #005da0' },
          '100%': { boxShadow: '0 0 20px #005da0, 0 0 30px #00a8ff' },
        }
      }
    },
  },
  plugins: [],
}
