/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'earth-dark': '#1c1310',
        'earth-darker': '#150e0c',
        'earth-accent': '#e8873a',
        'earth-cream': '#e8d5ca',
        'earth-muted': '#7a5a4a',
        'earth-muted-dark': '#5a4035',
        'earth-divider': '#26180f',
      },
      fontFamily: {
        'dm-sans': ["'DM Sans'", 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
