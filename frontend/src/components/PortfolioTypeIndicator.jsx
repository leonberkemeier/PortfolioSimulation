export default function PortfolioTypeIndicator({ modelName }) {
  if (modelName) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-900 border border-purple-700 rounded-full">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-purple-200">Model: {modelName}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-900 border border-blue-700 rounded-full">
      <span className="text-xs font-semibold text-blue-200">Manual</span>
    </div>
  );
}
