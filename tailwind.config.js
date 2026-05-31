/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'dw-bg': '#080810',
        'dw-surface': '#0F0F1A',
        'dw-card': '#121220',
        'dw-elevated': '#1A1A2E',
        'dw-text': '#F1F5F9',
        'dw-text-2': '#94A3B8',
        'dw-text-3': '#475569',
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.4)' },
          '70%': { boxShadow: '0 0 0 12px rgba(124,58,237,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0)' },
        },
      },
    },
  },
  plugins: [],
};
