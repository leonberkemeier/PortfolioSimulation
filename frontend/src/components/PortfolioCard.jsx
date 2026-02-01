import { Link } from 'react-router-dom';
import PortfolioTypeIndicator from './PortfolioTypeIndicator';

export default function PortfolioCard({ portfolio }) {
  const returnColor = portfolio.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400';
  const isManual = !portfolio.model_name;
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-600 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{portfolio.name}</h3>
          <p className="text-slate-400 text-sm">ID: {portfolio.id}</p>
        </div>
        <PortfolioTypeIndicator modelName={portfolio.model_name} />
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

      <div className="flex gap-2 mt-4">
        <Link
          to={`/portfolio/${portfolio.id}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition text-center text-sm font-semibold"
        >
          Details
        </Link>
        {isManual && (
          <Link
            to={`/portfolio/${portfolio.id}/trade`}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition text-center text-sm font-semibold"
          >
            Trade
          </Link>
        )}
      </div>
    </div>
  );
}
