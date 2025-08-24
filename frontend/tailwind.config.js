/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00A4EF',
        'primary-dark': '#0056b3',
        secondary: '#2B2B2B',
        accent: '#FFB800',
        'accent-dark': '#ff9500',
        background: '#F5F7FA',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      fontFamily: {
        'sans': ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'sans-serif']
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00A4EF 0%, #0056b3 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFB800 0%, #ff9500 100%)',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ]
}
