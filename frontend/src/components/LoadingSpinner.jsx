export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
