export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="h-8 bg-slate-700/50 rounded-lg w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-700/30 rounded w-20"></div>
        </div>
        <div className="h-8 bg-slate-700/50 rounded-xl w-24"></div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="h-4 bg-slate-700/30 rounded w-32 mb-3"></div>
          <div className="h-10 bg-slate-700/50 rounded-lg w-full"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-slate-700/30 rounded-lg"></div>
          <div className="h-16 bg-slate-700/30 rounded-lg"></div>
        </div>

        <div className="h-6 bg-slate-700/30 rounded-lg"></div>

        <div className="h-20 bg-slate-700/50 rounded-xl"></div>
      </div>

      <div className="flex gap-3 mt-6">
        <div className="flex-1 h-12 bg-slate-700/50 rounded-xl"></div>
        <div className="flex-1 h-12 bg-slate-700/50 rounded-xl"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
              <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-slate-700/50 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-6 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700/50 rounded-lg"></div>
            <div className="h-4 bg-slate-700/30 rounded w-24"></div>
          </div>
          <div className="h-8 bg-slate-700/50 rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-slate-700/50 rounded w-48 mb-6"></div>
      <div className="h-80 bg-slate-900/50 rounded-lg flex items-end justify-around gap-2 p-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-700/50 rounded-t w-full"
            style={{ height: `${Math.random() * 100}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
