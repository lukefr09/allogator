/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Light theme colors (used directly with CSS variables)
        'bg': 'var(--bg)',
        'bg-subtle': 'var(--bg-subtle)',
        'text-primary': 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'rule': 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'positive': 'var(--positive)',
        'negative': 'var(--negative)',
        'warning': 'var(--warning)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'input-focus': 'var(--input-focus)',
      },
      fontFamily: {
        'serif': ['Instrument Serif', 'Georgia', 'serif'],
        'sans': ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'logo': '26px',
        'section-title': '22px',
        'section-title-sm': '18px',
        'data': '15px',
        'label': '12px',
        'meta': '11px',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      borderRadius: {
        'sm': '2px',
      },
    },
  },
  plugins: [],
}
