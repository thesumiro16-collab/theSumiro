export default function Spinner({ fullPage = false }) {
  const spinner = (
    <div
      className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
