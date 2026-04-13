/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'subheading': ['"Cormorant Garamond"', 'serif'],
        'body': ['"EB Garamond"', 'serif'],
      },
      colors: {
        parchment: {
          50: '#faf7f0',
          100: '#f5efe3',
          200: '#ede4d3',
          300: '#e0d4bc',
          400: '#d4c3a5',
          500: '#c9b38e',
          600: '#b8a075',
          700: '#9a855e',
          800: '#7d6a4b',
          900: '#63553c',
        },
        gold: {
          100: '#f9f1d8',
          200: '#f0e4b8',
          300: '#e6d596',
          400: '#dbc670',
          500: '#c9ad4a',
          600: '#b3983e',
          700: '#947a33',
          800: '#78632b',
          900: '#615225',
        },
        ink: {
          100: '#2d2620',
          200: '#251f1a',
          300: '#1d1814',
          400: '#151210',
          500: '#0d0c0a',
        },
      },
      backgroundImage: {
        'parchment': 'linear-gradient(135deg, #f5efe3 0%, #ede4d3 25%, #e0d4bc 50%, #ede4d3 75%, #f5efe3 100%)',
        'aged-paper': 'linear-gradient(to bottom, rgba(139,119,93,0.03) 0%, rgba(139,119,93,0.08) 50%, rgba(139,119,93,0.03) 100%)',
      },
      boxShadow: {
        'ornate': '0 4px 24px rgba(109, 82, 60, 0.15), 0 0 1px rgba(109, 82, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        'gold-glow': '0 0 30px rgba(201, 173, 74, 0.3), 0 0 60px rgba(201, 173, 74, 0.15)',
        'card': '0 2px 8px rgba(13, 12, 10, 0.3), 0 8px 24px rgba(13, 12, 10, 0.2)',
      },
    },
  },
  plugins: [],
}
