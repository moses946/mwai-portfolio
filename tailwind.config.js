/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        youtube: '#FF0000', // Adding YouTube red
      },
    },
  },
  plugins: [],
}