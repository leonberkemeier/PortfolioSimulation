import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowRight } from 'lucide-react';
import PortfolioTypeIndicator from './PortfolioTypeIndicator';

export default function PortfolioCard({ portfolio }) {
  const returnColor = portfolio.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400';
  const returnBgColor = portfolio.total_return_pct >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
  const returnBorderColor = portfolio.total_return_pct >= 0 ? 'border-green-500/20' : 'border-red-500/20';
  const isManual = !portfolio.model_name;
  const deployedPct = ((portfolio.nav - portfolio.current_cash) / portfolio.nav * 100).toFixed(1);
  
  return (
    <div className="group relative glass rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 -z-10"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
            {portfolio.name}
          </h3>
          <p className="text-slate-500 text-sm">ID: {portfolio.id}</p>
        </div>
        <PortfolioTypeIndicator modelName={portfolio.model_name} />
      </div>

      {/* Main Stats */}
      <div className="space-y-4 mb-6">
        {/* NAV - Featured */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-blue-400" size={16} />
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Net Asset Value</span>
          </div>
          <p className="text-3xl font-black text-white">
            ${parseFloat(portfolio.nav).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Other Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500 text-xs mb-1">Initial Capital</p>
            <p className="text-white font-semibold text-sm">
              ${parseFloat(portfolio.initial_capital).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Cash Available</p>
            <p className="text-white font-semibold text-sm">
              ${parseFloat(portfolio.current_cash).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Deployed Capital Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Deployed Capital</span>
            <span className="text-slate-400 font-medium">{deployedPct}%</span>
          </div>
          <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${deployedPct}%` }}
            ></div>
          </div>
        </div>

        {/* Return - Featured */}
        <div className={`${returnBgColor} ${returnBorderColor} border rounded-xl p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {portfolio.total_return_pct >= 0 ? (
                <TrendingUp className="text-green-400" size={20} />
              ) : (
                <TrendingDown className="text-red-400" size={20} />
              )}
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Return</span>
            </div>
            <span className={`text-2xl font-black ${returnColor}`}>
              {portfolio.total_return_pct >= 0 ? '+' : ''}{portfolio.total_return_pct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          to={`/portfolio/${portfolio.id}`}
          className="group/btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white py-3 rounded-xl transition-all duration-300 text-sm font-bold hover:shadow-lg hover:shadow-blue-500/50"
        >
          <Activity size={16} />
          Details
          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
        {isManual && (
          <Link
            to={`/portfolio/${portfolio.id}/trade`}
            className="group/btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white py-3 rounded-xl transition-all duration-300 text-sm font-bold hover:shadow-lg hover:shadow-green-500/50"
          >
            <TrendingUp size={16} />
            Trade
          </Link>
        )}
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <div className={`w-2 h-2 rounded-full ${portfolio.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
      </div>
    </div>
  );
}
