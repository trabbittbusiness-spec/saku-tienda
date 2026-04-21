/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F47321',
          navy: '#1A1A3F',
          gray: {
            light: '#F8F9FB',
            medium: '#666666',
            dark: '#1A1A1A',
          }
        },
        premium: {
          black: '#121212',
          gold: '#C5A059',
          silver: '#C0C0C0',
          white: '#F5F5F7',
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
};
