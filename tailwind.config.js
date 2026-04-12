/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E6BAA',
          dark:    '#15538A',
          deeper:  '#0D2137',
          mid:     '#2E85C7',
          light:   '#D4EBF8',
          faint:   '#EEF6FC',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark:    '#D97706',
          deeper:  '#B45309',
          light:   '#FEF3C7',
          faint:   '#FFFBEB',
        },
        navy: {
          DEFAULT: '#0D2137',
          mid:     '#162E4D',
          light:   '#1E3A5F',
        },
        tide: {
          bg:      '#FDFCF9',
          warm:    '#F5F1EB',
          surface: '#FFFFFF',
          text:    '#0D1F3C',
          muted:   '#5A6A7E',
          subtle:  '#F0EDE8',
          border:  '#E2DDD7',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif Devanagari"', '"Noto Serif Gujarati"', 'serif'],
        body:    ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', '"Noto Sans Gujarati"', 'sans-serif'],
      },
      boxShadow: {
        card:         '0 1px 4px rgba(13,33,55,0.06), 0 4px 20px rgba(13,33,55,0.04)',
        'card-hover': '0 6px 20px rgba(13,33,55,0.10), 0 16px 48px rgba(13,33,55,0.07)',
        nav:          '0 1px 0 rgba(0,0,0,0.06)',
        glow:         '0 0 0 4px rgba(30,107,170,0.15)',
        'glow-amber': '0 0 0 4px rgba(245,158,11,0.20)',
        float:        '0 8px 32px rgba(13,33,55,0.14)',
      },
      backgroundImage: {
        'hero-overlay':   'linear-gradient(105deg, rgba(13,33,55,0.90) 0%, rgba(13,33,55,0.58) 55%, rgba(13,33,55,0.18) 100%)',
        'card-overlay':   'linear-gradient(180deg, transparent 35%, rgba(13,33,55,0.88) 100%)',
        'warm-gradient':  'linear-gradient(135deg, #FDFCF9 0%, #EEF6FC 100%)',
        'blue-gradient':  'linear-gradient(135deg, #0D2137 0%, #1E6BAA 100%)',
        'amber-gradient': 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s infinite',
      },
      keyframes: {
        float:     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.65' } },
        shimmer:   { '0%': { backgroundPosition: '-400% 0' }, '100%': { backgroundPosition: '400% 0' } },
      },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
    },
  },
  plugins: [],
}
