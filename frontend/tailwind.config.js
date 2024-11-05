const withMT = require("@material-tailwind/react/utils/withMT");
 
module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  /* These text colors are generated dynamically in vulnerabilities
     Tailwindcss can't create them at compile time so we explicitly add them here. */
  safelist: [
    'text-[#3399FF]',
    'text-[#FF491C]',
    'text-[#F66E09]',
    'text-[#FBBC02]',
    'text-[#20B803]'
  ],
  
  theme: {
    extend: {},
    colors: {
      primary: '#4090C7',
      secondary: '#D60C5F',
      'white': '#ffffff',
      'gray-lightest': '#faf8f8',
      'gray-lighter': '#e6e4e5',
      'gray-light': '#d2d0d1',
      'gray': '#c0bebe',
      'gray-dark': '#989696',
      'gray-darker': '#706f6f',
      'gray-darkest': '#4a4848',
      'black': '#222021',

      'brand-light': '#fdcdd4',
      'brand': '#d60c5f',
      'brand-dark': '#671931',

      'cta-light': '#d5f6cb',
      'cta': '#0cd61e',
      'cta-dark': '#20661b',

      'info-light': '#e3eff6',
      'info': '#89bedd',
      'info-dark': '#445b68',

      'warning-light': '#ffeece',
      'warning': '#fabc32',
      'warning-dark': '#765a20',

      'success-light': '#e2f3d3',
      'success': '#80ce4e',
      'success-dark': '#41622b',

      'danger-light': '#ffd1ce',
      'danger': '#f72d4a',
      'danger-dark': '#762227',
      // ...
    }
  },
  plugins: [],
});