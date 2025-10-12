/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6A00', // Màu chính
          light: '#FF6A00',   // Màu sáng hơn
          dark: '#FF6A00',    // Màu tối hơn
        },
        secondary: {
          DEFAULT: '#F97316', // Màu cam phụ để tạo điểm nhấn
        },
      },
    },
  },
  plugins: [],
}