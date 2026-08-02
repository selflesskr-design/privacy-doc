/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Privacy palette, taken from the logo: orange accent on an ivory
        // ground with dark-brown type. See src/config/brand.js and
        // docs/brand-assets.md.
        //
        // Status colours are deliberately NOT part of this scale — success stays
        // green, errors red, warnings amber, so a coloured state still reads as
        // a state and not as branding.
        brand: {
          50: '#FEF6EE',
          100: '#FDE9D4',
          200: '#FAD0A8',
          300: '#F6B173',
          400: '#F2913F', // dark-mode accent (7.9:1 on the dark ground)
          500: '#EE8130', // the logo orange
          600: '#B85512', // primary CTA — 4.8:1 with white text
          700: '#8F4210', // hover / focus
          800: '#733712',
          900: '#5C2D12',
          950: '#331708',
        },
        // `slate` is overridden rather than renamed: the UI already uses slate-*
        // in ~40 files, so remapping the scale warms the whole interface without
        // touching a single class name.
        slate: {
          50: '#FBF7F2', // page ground (ivory)
          100: '#F4EDE4', // cards, secondary surfaces (beige)
          200: '#E7DACA', // borders
          300: '#D5C3AC',
          400: '#B29B7F',
          500: '#7E6A55', // muted text — 4.8:1 on ivory
          600: '#6E5B48', // secondary text — 6.1:1
          700: '#574636',
          800: '#3E3227',
          900: '#2B221A', // primary text — 14.6:1
          950: '#17120F', // dark page ground
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
