export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 border-4 border-slate-700/30 rounded-full"></div>
          {/* Spinning gradient ring */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin"></div>
          {/* Inner pulsing dot */}
          <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-300 font-medium">Loading...</p>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
