export default function PortfolioCard({ portfolio }) {
  const returnColor = portfolio.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400';
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-600 transition cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{portfolio.name}</h3>
          <p className="text-slate-400 text-sm">ID: {portfolio.id}</p>
        </div>
        <span className="px-3 py-1 bg-blue-600 rounded-full text-sm text-white">
          {portfolio.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-400">NAV</span>
          <span className="text-white font-semibold">${parseFloat(portfolio.nav).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Initial Capital</span>
          <span className="text-white">${parseFloat(portfolio.initial_capital).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Cash</span>
          <span className="text-white">${parseFloat(portfolio.current_cash).toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-slate-700">
          <span className="text-slate-400">Return</span>
          <span className={`font-bold ${returnColor}`}>
            {portfolio.total_return_pct.toFixed(2)}%
          </span>
        </div>
      </div>

      <button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition">
        View Details
      </button>
    </div>
  );
}
