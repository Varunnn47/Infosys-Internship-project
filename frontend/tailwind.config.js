/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        purple: { DEFAULT: '#8b5cf6', dark: '#7c3aed' },
        pink: '#ec4899',
        cyan: '#06b6d4',
        bg: { DEFAULT: '#0f172a', 2: '#1e293b', 3: '#334155' },
        card: '#1e293b',
        border: '#334155',
        sub: '#cbd5e1',
        muted: '#94a3b8',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      boxShadow: { glow: '0 8px 25px rgba(139,92,246,0.25)', 'glow-lg': '0 12px 35px rgba(139,92,246,0.35)' },
      animation: {
        'grad-shift': 'gradShift 4s ease infinite',
        bob: 'bob 3s ease-in-out infinite',
        spin: 'spin 0.9s linear infinite',
        typing: 'typing 1.4s infinite',
        'slide-in': 'slideIn 0.3s ease',
        'fade-in': 'fadeIn 0.4s ease',
        'scale-in': 'scaleIn 0.3s ease',
      },
      keyframes: {
        gradShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        typing: { '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.4' }, '30%': { transform: 'translateY(-10px)', opacity: '1' } },
        slideIn: { from: { transform: 'translateX(120%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
