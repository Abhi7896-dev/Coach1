/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d8e0',
          300: '#aab1bf',
          400: '#7c8597',
          500: '#5a6478',
          600: '#434b5d',
          700: '#353c4b',
          800: '#272c38',
          900: '#1a1e28',
          950: '#0f1219',
        },
        // Athlete Orange — energy, action, the coach's spark
        orange: {
          50: '#fff6ed',
          100: '#ffe9d4',
          200: '#ffcea8',
          300: '#ffac70',
          400: '#ff7f37',
          500: '#fb5a0c',
          600: '#ec420a',
          700: '#c42f0c',
          800: '#9c2711',
          900: '#7e2313',
          950: '#440d04',
        },
        // Trust Blue — reliability, the parent's peace of mind
        blue: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcddff',
          300: '#8ec6ff',
          400: '#59a4ff',
          500: '#3282fb',
          600: '#1c63f0',
          700: '#174fdc',
          800: '#193fb2',
          900: '#1a388c',
          950: '#152456',
        },
        // Growth Green — progress, the child's journey
        green: {
          50: '#edfcf3',
          100: '#d4f8e0',
          200: '#aef0c6',
          300: '#76e2a3',
          400: '#3dcb7c',
          500: '#19b062',
          600: '#0a8f4e',
          700: '#08723f',
          800: '#0a5b35',
          900: '#094a2d',
          950: '#022a18',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px -12px rgba(15,18,25,0.45)',
        'glow-orange': '0 0 0 1px rgba(251,90,12,0.25), 0 18px 50px -12px rgba(251,90,12,0.45)',
        'glow-blue': '0 0 0 1px rgba(28,99,240,0.25), 0 18px 50px -12px rgba(28,99,240,0.45)',
        'glow-green': '0 0 0 1px rgba(10,143,78,0.25), 0 18px 50px -12px rgba(10,143,78,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        marquee: 'marquee 28s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
