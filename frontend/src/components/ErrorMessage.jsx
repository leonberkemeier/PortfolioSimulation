export default function ErrorMessage({ message }) {
  return (
    <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
      <p className="font-semibold">Error</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}
