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
        navy: { DEFAULT: '#0f1f3d', light: '#1a3460', muted: '#2d4a7a' },
        teal: { DEFAULT: '#0ea5a0', light: '#e0f7f6', dark: '#0d8f8a' },
        coral: { DEFAULT: '#f05a5a', light: '#fef0f0', dark: '#d44444' },
        brand: {
          50: '#e0f7f6', 100: '#b3eeec', 200: '#80e4e1', 300: '#4dd9d5',
          400: '#26d0cc', 500: '#0ea5a0', 600: '#0d8f8a', 700: '#0a7470',
          800: '#085a57', 900: '#053e3c',
        },
        warm: { white: '#fafaf8', gray: '#f4f4f2', border: '#e8e8e4' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '20px',
        '4xl': '28px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'elevated': '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'floating': '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
        'glow-teal': '0 0 20px rgba(14,165,160,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-right': 'slideInRight 0.3s ease-out forwards',
        'pulse-ring': 'pulse-ring 2s infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
