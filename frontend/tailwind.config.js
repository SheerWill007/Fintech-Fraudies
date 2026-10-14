/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces (darkest -> lightest)
        background: '#0a0a0a',
        card: {
          DEFAULT: '#0f0f0f',
          foreground: '#ededed',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        surface: {
          DEFAULT: '#0f0f0f',
          2: '#141414',
          3: '#1e1e1e',
        },
        line: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          strong: 'rgba(255, 255, 255, 0.1)',
        },
        // Text
        foreground: '#ffffff',
        ink: {
          DEFAULT: '#ffffff',
          2: 'rgba(255, 255, 255, 0.78)',
        },
        muted: 'rgba(255, 255, 255, 0.5)',
        faint: 'rgba(255, 255, 255, 0.3)',
        // Brand + semantic
        accent: {
          DEFAULT: '#4ade80',
          hover: '#6ee7a0',
          strong: '#22c55e',
          foreground: '#000000',
        },
        primary: {
          DEFAULT: '#4ade80',
          foreground: '#000000',
        },
        good: '#4ade80',
        bad: '#f87171',
        warn: '#facc15',
        info: '#60a5fa',
        // Chart series
        legit: '#3b82f6',
        fraud: '#eab308',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        base: ['14px', '1.5'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
      },
      boxShadow: {
        pop: '0 16px 40px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.06)',
        glow: '0 8px 32px -8px rgb(74 222 128 / 0.45)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
