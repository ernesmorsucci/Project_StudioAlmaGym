/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alma: {
          bg: '#FAF8F5',       
          sidebar: '#FFFFFF',  
          olive: '#7A8B76',    
          oliveHover: '#657461', 
          text: '#333333',     
          textLight: '#8A8A8A', 
          border: '#E8E6E1',   
          warning: '#D4A373',  
          danger: '#E07A5F',   
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}