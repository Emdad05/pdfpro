/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9ee',
          100: '#f8edcc',
          200: '#f0d98a',
          300: '#e8c456',
          400: '#C9A84C',
          500: '#b8942e',
          600: '#9a7a22',
          700: '#7a5f1c',
          800: '#5c4716',
          900: '#3d2f0f',
        },
        obsidian: {
          50:  '#f5f5f5',
          100: '#e0e0e0',
          200: '#b8b8b8',
          300: '#8a8a8a',
          400: '#5c5c5c',
          500: '#2a2a2a',
          600: '#1a1a1a',
          700: '#141414',
          800: '#0d0d0d',
          900: '#080808',
          950: '#040404',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':   'fadeIn 0.5s ease forwards',
        'line-grow': 'lineGrow 1s ease forwards',
        'shimmer':   'shimmer 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        lineGrow: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition: '400% 0' },
        },
      },
    },
  },
  plugins: [],
};
