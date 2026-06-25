export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-800 transition-all"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-800 transition-all"
      >
        Next
      </button>
    </div>
  );
}
