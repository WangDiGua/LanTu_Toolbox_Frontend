/** @type {import('tailwindcss').Config */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./{api,components,config,layout,pages,router,services,store,utils}/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        primaryHover: 'var(--primary-hover)',
        secondary: '#64748b',
        background: 'var(--background)',
        surface: 'var(--surface)',
      },
      fontFamily: {
        default: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        rounded: ['Nunito', 'Quicksand', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
