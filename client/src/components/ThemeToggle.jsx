// ============================================================
//  components/ThemeToggle.jsx — light/dark mode switch
//  ============================================================
//  A small button that toggles the `dark` class on <html> and saves
//  the preference to localStorage so it persists across visits.
//
//  LEARNING NOTE — Tailwind dark mode with the "class" strategy:
//  When Tailwind is configured with darkMode: 'class', every utility
//  like `bg-white dark:bg-purple-900` has two versions: the normal
//  one (used in light mode) and the `dark:` prefixed one (used only
//  when an ancestor carries the `dark` class). By toggling that class
//  on <html>, the whole app re-themes instantly.
// ============================================================

import { useState } from 'react';

const ThemeToggle = () => {
  // Initialize from localStorage (the index.html script already set
  // the class before render; here we just mirror it into state).
  const [dark, setDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  );

  // Toggle the class + persist the choice.
  const toggle = () => {
    const next = !dark;
    setDark(next);
    // Add/remove `dark` on the root <html> element.
    document.documentElement.classList.toggle('dark', next);
    // Remember the preference.
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800 transition"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Sun / moon icon swaps depending on current mode */}
      {dark ? (
        // Sun icon (shown in dark mode, to switch to light)
        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.9 2.9a1 1 0 011.4 0l.7.7a1 1 0 01-1.4 1.4l-.7-.7a1 1 0 010-1.4zm-9.8 0a1 1 0 010 1.4l-.7.7a1 1 0 01-1.4-1.4l.7-.7a1 1 0 011.4 0zM10 5a5 5 0 100 10 5 5 0 000-10zm6 5a1 1 0 001 1h1a1 1 0 100-2h-1a1 1 0 00-1 1zM2 10a1 1 0 001 1h1a1 1 0 100-2H3a1 1 0 00-1 1zm11.3 4.1a1 1 0 011.4 0l.7.7a1 1 0 01-1.4 1.4l-.7-.7a1 1 0 010-1.4zm-8.4 0a1 1 0 010 1.4l-.7.7a1 1 0 01-1.4-1.4l.7-.7a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Moon icon (shown in light mode, to switch to dark)
        <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.3 13.3A8 8 0 016.7 2.7 8 8 0 1017.3 13.3z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;