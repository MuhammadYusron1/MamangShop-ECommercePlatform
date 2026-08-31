// ============================================================
//  tailwind.config.js — TailwindCSS theme configuration
//  ============================================================
//  Tailwind is a "utility-first" CSS framework: instead of writing
//  custom CSS, you compose utility classes directly in JSX
//  (e.g. className="bg-mamang-purple text-white px-4").
//
//  We extend Tailwind's default palette with the brand colors:
//    cream   #FFF4BF
//    pink    #FFBEFB
//    lilac   #DC95FF
//    purple  #8C56D4
//  We also enable DARK MODE using the "class" strategy. This means
//  dark mode activates when a `dark` class is present on an ancestor
//  (we toggle it on <html>). The default ("media") strategy would go
//  off the OS setting; "class" gives the user a manual toggle instead.
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode via a manual `.dark` class on <html>.
  darkMode: 'class',

  // Scan these files for class names so Tailwind only generates the
  // CSS we actually use (keeps the bundle small).
  content: ['./index.html', './src/**/*.{js,jsx}'],

  theme: {
    extend: {
      // --- Brand color palette (from the spec) ---
      colors: {
        cream: {
          DEFAULT: '#FFF4BF',
          light: '#FFF9DB',
          dark: '#F2E49B',
        },
        pink: {
          DEFAULT: '#FFBEFB',
          light: '#FFDBFE',
          dark: '#E79BE3',
        },
        lilac: {
          DEFAULT: '#DC95FF',
          light: '#EBBDFF',
          dark: '#C074E6',
        },
        purple: {
          DEFAULT: '#8C56D4',
          light: '#A678E0',
          dark: '#6F3DB3',
        },
      },
      // --- Slightly soft box shadow for cards ---
      boxShadow: {
        card: '0 4px 12px rgba(140, 86, 212, 0.15)',
      },
    },
  },
  plugins: [],
};
