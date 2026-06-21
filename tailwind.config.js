/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'novel-dark': '#0f1115',
        'novel-card': '#1a1d23',
        'novel-border': '#2a2e37',
        'novel-text': '#e4e6eb',
        'novel-muted': '#8b8fa3',
        'novel-accent': '#7c5cff',
        'novel-must': '#ff5c7c',
        'novel-feed': '#f5a623',
        'novel-watch': '#4ecdc4',
        'xuanhuan': '#7c5cff',
        'yanqing': '#ff6b9d',
        'xuanyi': '#4ecdc4',
        'tongren': '#f5a623',
        'qita': '#8b8fa3',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
