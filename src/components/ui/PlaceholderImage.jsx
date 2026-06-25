export default function PlaceholderImage({ className = '' }) {
  return (
    <div
      className={`flex items-center justify-center bg-primary ${className}`}
      role="img"
      aria-label="No photo available"
      style={{ minHeight: '160px' }}
    >
      <div className="text-center text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-2 h-10 w-10 opacity-75"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18M3.75 9.75h.008v.008H3.75V9.75z"
          />
        </svg>
        <span className="text-sm font-medium">No Photo</span>
      </div>
    </div>
  );
}
