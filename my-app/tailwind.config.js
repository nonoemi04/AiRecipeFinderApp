/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}",'./screens/**/*.{js,jsx,ts,tsx}'],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'my-gray': '#f4f4f4',
        'gnd-gray': '#e0e0e0',
        'my-purple': '#6C4AB6'
      }
    },
  },
  plugins: [],
}