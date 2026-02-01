import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, Layers, Plus, RefreshCw } from 'lucide-react';
import { portfolios, analytics } from '../services/api';
import PortfolioCard from './PortfolioCard';
import LoadingSpinner from './LoadingSpinner';

export default function Dashboard() {
  const [portfolioList, setPortfolioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalNav, setTotalNav] = useState(0);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await portfolios.list(0, 100);
      setPortfolioList(response.data.portfolios);
      setTotalNav(response.data.total_nav);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolios');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const activeCount = portfolioList.filter(p => p.status === 'active').length;
  const totalReturn = portfolioList.reduce((sum, p) => sum + p.total_return_pct, 0);
  const avgReturn = portfolioList.length > 0 ? totalReturn / portfolioList.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Optimized Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border-b border-slate-700/50">
        {/* Background Pattern - Optimized with will-change */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 will-change-transform" aria-hidden="true"></div>
        
        <div className="relative px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
          {/* Title Row - Responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-fadeIn leading-tight">
                Trading Simulator
              </h1>
              <p className="text-slate-400 text-sm sm:text-base lg:text-lg animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                Professional Portfolio Management & Backtesting Platform
              </p>
            </div>
            
            {/* Refresh Button - Mobile Optimized */}
            <button
              onClick={() => fetchPortfolios(true)}
              disabled={refreshing}
              className="self-start sm:self-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/80 rounded-xl text-slate-300 transition-all duration-200 hover:scale-105 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label={refreshing ? 'Refreshing portfolios' : 'Refresh portfolios'}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="font-medium text-sm">Refresh</span>
            </button>
          </div>

          {/* Stats Grid - Optimized Responsive Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total NAV */}
            <article className="glass rounded-xl p-4 sm:p-6 hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.02] animate-fadeIn will-change-transform" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <TrendingUp className="text-blue-400" size={18} />
                </div>
                <h2 className="text-slate-400 text-xs sm:text-sm font-medium">Total NAV</h2>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white truncate" title={`$${parseFloat(totalNav).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                ${parseFloat(totalNav).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Net Asset Value</p>
            </article>

            {/* Active Portfolios */}
            <article className="glass rounded-xl p-4 sm:p-6 hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.02] animate-fadeIn will-change-transform" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                  <Wallet className="text-green-400" size={18} />
                </div>
                <h2 className="text-slate-400 text-xs sm:text-sm font-medium">Active Portfolios</h2>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-slate-500 mt-1">Currently trading</p>
            </article>

            {/* Total Portfolios */}
            <article className="glass rounded-xl p-4 sm:p-6 hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.02] animate-fadeIn will-change-transform" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <Layers className="text-purple-400" size={18} />
                </div>
                <h2 className="text-slate-400 text-xs sm:text-sm font-medium">Total Portfolios</h2>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{portfolioList.length}</p>
              <p className="text-xs text-slate-500 mt-1">All portfolios</p>
            </article>

            {/* Average Return */}
            <article className="glass rounded-xl p-4 sm:p-6 hover:bg-slate-800/40 transition-all duration-300 hover:scale-[1.02] animate-fadeIn will-change-transform" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className={`p-1.5 sm:p-2 ${avgReturn >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg flex-shrink-0`}>
                  <TrendingUp className={avgReturn >= 0 ? 'text-green-400' : 'text-red-400'} size={18} />
                </div>
                <h2 className="text-slate-400 text-xs sm:text-sm font-medium">Avg Return</h2>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Average across all</p>
            </article>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-8 mt-6 p-4 glass border-red-500/50 rounded-xl text-red-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            {error}
          </div>
        </div>
      )}

      {/* Portfolios Section */}
      <div className="p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Your Portfolios</h2>
            <p className="text-slate-400">Manage and monitor your trading strategies</p>
          </div>
          <Link
            to="/create-portfolio"
            className="group self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            New Portfolio
          </Link>
        </div>

        {portfolioList.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="text-slate-500" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No portfolios yet</h3>
            <p className="text-slate-400 text-lg mb-8">Create your first portfolio to start trading</p>
            <Link
              to="/create-portfolio"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
            >
              <Plus size={20} />
              Create Your First Portfolio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {portfolioList.map((portfolio, index) => (
              <div key={portfolio.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                <PortfolioCard portfolio={portfolio} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
