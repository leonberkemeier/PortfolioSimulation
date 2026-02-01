export default function ModelCard({ metrics, isSelected, onSelect }) {
  const returnColor = metrics.avgReturn >= 0 ? 'text-green-400' : 'text-red-400';
  const pnlColor = metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-6 cursor-pointer transition transform hover:scale-105 ${
        isSelected
          ? 'bg-blue-900 border-blue-600 ring-2 ring-blue-500'
          : 'bg-slate-800 border-slate-700 hover:border-blue-600'
      }`}
    >
      <h3 className="text-lg font-bold text-white mb-4 truncate">{metrics.modelName}</h3>

      <div className="space-y-3">
        <div>
          <p className="text-slate-400 text-sm">Portfolios</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.portfolioCount}</p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">Combined NAV</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${metrics.totalNav.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">Avg Return</p>
          <p className={`text-2xl font-bold mt-1 ${returnColor}`}>
            {metrics.avgReturn.toFixed(2)}%
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">Combined P&L</p>
          <p className={`text-2xl font-bold mt-1 ${pnlColor}`}>
            ${metrics.totalPnL.toFixed(2)}
          </p>
        </div>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-blue-700">
          <p className="text-blue-200 text-sm font-semibold">▼ Selected - View Details Below</p>
        </div>
      )}
    </div>
  );
}
