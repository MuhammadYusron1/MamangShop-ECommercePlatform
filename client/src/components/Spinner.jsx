// ============================================================
//  components/Spinner.jsx — loading indicator
//  ============================================================
//  A simple CSS-animated spinner. Used while data is being fetched
//  from the API to give the user visual feedback.
//
//  Tailwind's `animate-spin` utility applies a CSS keyframe animation
//  that rotates the element indefinitely — no custom CSS needed.
// ============================================================

const Spinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-purple-200 dark:border-purple-700 border-t-purple-600 dark:border-t-lilac rounded-full animate-spin" />
      <span className="text-sm text-purple-400 dark:text-lilac">{message}</span>
    </div>
  );
};

export default Spinner;