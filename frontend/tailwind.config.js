/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        muted: '#888888',
        primary: {
          DEFAULT: '#e8e8e8',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#111111',
          foreground: '#ededed',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
