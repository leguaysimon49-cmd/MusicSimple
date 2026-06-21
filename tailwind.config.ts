import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        simple: {
          green: '#1DB954',
          dark: '#050505',
          panel: '#121212',
          card: '#181818',
          soft: '#242424'
        }
      },
      boxShadow: {
        glow: '0 0 50px rgba(29,185,84,.18)'
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.035)' } },
        shimmer: { '0%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } }
      },
      animation: {
        rise: 'rise .45s ease both',
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
