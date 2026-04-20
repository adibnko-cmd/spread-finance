/** @type {import('tailwindcss').Config} */

const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── SPREAD FINANCE DESIGN SYSTEM v1 ──────────────────────────
      colors: {
        // Primaires
        dark: '#292929',
        white: '#FFFFFF',
        blue: {
          DEFAULT: '#3183F7',
          dark: '#1a5fc8',
          light: '#EBF2FF',
        },
        // Sémantiques
        success: {
          DEFAULT: '#36D399',
          light: '#E6FAF3',
        },
        warning: {
          DEFAULT: '#FFC13D',
          light: '#FFF8E6',
        },
        danger: {
          DEFAULT: '#F56751',
          light: '#FEF0EE',
        },
        accent: {
          DEFAULT: '#A855F7',
          light: '#F3EFFF',
        },
        // Gris fonctionnels
        gray: {
          50:  '#F9FAFB',
          100: '#F5F6F8',
          200: '#E8E8E8',
          300: '#D0D0D0',
          400: '#aaa',
          500: '#888',
          600: '#555',
          700: '#444',
          800: '#292929',
        },
      },
      fontFamily: {
        // Spread Finance — Work Sans principale
        sans: ['Work Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Permanent Marker — usage très restreint (logo, accroches)
        marker: ['Permanent Marker', 'cursive'],
      },
      fontSize: {
        // Scale typographique DS v1
        'display': ['56px', { lineHeight: '1.05', fontWeight: '900', letterSpacing: '-0.02em' }],
        'h1':      ['36px', { lineHeight: '1.1',  fontWeight: '800', letterSpacing: '-0.01em' }],
        'h2':      ['28px', { lineHeight: '1.2',  fontWeight: '700' }],
        'h3':      ['20px', { lineHeight: '1.3',  fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.75', fontWeight: '400' }],
        'body':    ['14px', { lineHeight: '1.7',  fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.65', fontWeight: '400' }],
        'label':   ['12px', { lineHeight: '1.4',  fontWeight: '600' }],
        'caption': ['11px', { lineHeight: '1.4',  fontWeight: '500' }],
        'micro':   ['10px', { lineHeight: '1.3',  fontWeight: '500' }],
      },
      borderRadius: {
        // DS v1 border radius
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        'pill': '9999px',
      },
      spacing: {
        // DS v1 spacing (4px base)
        'xs':  '4px',
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      boxShadow: {
        // Pas de shadows dans le DS (design flat)
        'none': 'none',
        // Uniquement pour focus rings
        'focus': '0 0 0 3px rgba(49, 131, 247, 0.15)',
        'focus-danger': '0 0 0 3px rgba(245, 103, 81, 0.12)',
      },
      backgroundImage: {
        // Pas de gradients dans le DS
      },
    },
  },
  plugins: [],
}

module.exports = config
