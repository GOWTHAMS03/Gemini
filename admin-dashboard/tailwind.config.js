/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        snow: {
          bg: '#F7F9FB',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          text: '#1C1C1C',
          muted: '#8C8C8C',
          border: '#E8ECEF',
          hover: '#F4F5F7',
          active: '#1C1C1C',
        },
        metric: {
          violet: '#E5ECF6',
          blue: '#E3F5FF',
          purple: '#F3E8FF',
          sky: '#E5F2FE',
          emerald: '#E6F9F3',
          rose: '#FEE2E2',
        },
        accent: {
          mint: '#4CD7B6',
          sky: '#80C3FF',
          lavender: '#B497E7',
          dark: '#1C1C1C',
          green: '#7CD992',
          blue: '#80B3FF',
        }
      },
      boxShadow: {
        'snow': '0 2px 8px 0 rgba(0, 0, 0, 0.02), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'snow-lg': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
