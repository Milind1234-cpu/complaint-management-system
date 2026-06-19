/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand: deep navy "ink" palette ──────────────────────────────
        ink: {
          50:  '#eef1f7',
          100: '#d5dce9',
          200: '#adb9d4',
          300: '#7f91b8',
          400: '#566e9e',
          500: '#3a5185',
          600: '#2e4070',
          700: '#243359',  // primary action
          800: '#1a2540',  // sidebar background
          900: '#111828',  // darkest text/hover
        },
        // ── Accent: warm amber ──────────────────────────────────────────
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // ── Ticket status colours ───────────────────────────────────────
        status: {
          open:        { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
          in_progress: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
          resolved:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
          closed:      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
        modal: '0 20px 60px -10px rgb(0 0 0 / .25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
