/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mewtwo: {
          purple: '#A040A0',
          light: '#D8B8D8',
          dark: '#5C2E5C',
        },
      },
    },
  },
  plugins: [],
}
