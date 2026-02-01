import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { analytics, orders, portfolios } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import HoldingsTable from '../tables/HoldingsTable';
import TransactionHistory from '../tables/TransactionHistory';
import PerformanceChart from '../charts/PerformanceChart';
import PortfolioTypeIndicator from '../PortfolioTypeIndicator';

export default function PortfolioDetail() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings');

  useEffect(() => {
    fetchPortfolioData();
  }, [id]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch portfolio details
      const portfolioRes = await portfolios.get(parseInt(id));
      setPortfolio(portfolioRes.data);

      // Fetch holdings
      const holdingsRes = await orders.holdings(parseInt(id));
      setHoldings(holdingsRes.data);

      // Fetch transaction history
      const transRes = await orders.history(parseInt(id), 0, 50);
      setTransactions(transRes.data.transactions);

      // Fetch performance metrics
      try {
        const perfRes = await analytics.performance(parseInt(id));
        setPerformance(perfRes.data);
      } catch (e) {
        console.log('Performance data not yet available');
      }

      // Fetch snapshots for chart
      try {
        const snapshotsRes = await analytics.snapshots(parseInt(id), 0, 100);
        setSnapshots(snapshotsRes.data.snapshots);
      } catch (e) {
        console.log('Snapshot data not yet available');
      }
    } catch (err) {
      setError('Failed to load portfolio data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} />
          Back to Portfolios
        </Link>
        <ErrorMessage message={error || 'Portfolio not found'} />
      </div>
    );
  }

  const isManual = !portfolio.model_name;
  const returnColor = portfolio.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={20} />
          Back to Portfolios
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{portfolio.name}</h1>
            <p className="text-slate-400">{portfolio.description || 'No description'}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <PortfolioTypeIndicator modelName={portfolio.model_name} />
            <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-200">
              Status: {portfolio.status}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Sidebar + Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
        {/* Left Sidebar - Stats & Metrics */}
        <aside className="lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
          {/* Quick Stats Card */}
          <div className="glass rounded-2xl p-6 space-y-4 sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Portfolio Metrics
            </h2>
            
            <div className="space-y-3">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Net Asset Value</p>
                <p className="text-2xl font-black text-white">
                  ${parseFloat(portfolio.nav).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/30 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">Initial</p>
                  <p className="text-white font-semibold text-sm">
                    ${parseFloat(portfolio.initial_capital).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 bg-slate-900/30 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">Cash</p>
                  <p className="text-white font-semibold text-sm">
                    ${parseFloat(portfolio.current_cash).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-500/20">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Return</p>
                <p className={`text-3xl font-black ${returnColor}`}>
                  {portfolio.total_return_pct >= 0 ? '+' : ''}{portfolio.total_return_pct.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            {performance && (
              <>
                <div className="h-px bg-slate-700/50 my-4"></div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Performance</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-900/30 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Sharpe</p>
                      <p className="text-white font-bold">
                        {performance.sharpe_ratio ? parseFloat(performance.sharpe_ratio).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Sortino</p>
                      <p className="text-white font-bold">
                        {performance.sortino_ratio ? parseFloat(performance.sortino_ratio).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Max DD</p>
                      <p className="text-red-400 font-bold">
                        {performance.max_drawdown ? parseFloat(performance.max_drawdown).toFixed(2) : 'N/A'}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-lg">
                      <p className="text-slate-500 text-xs mb-1">Volatility</p>
                      <p className="text-white font-bold">
                        {performance.volatility ? parseFloat(performance.volatility).toFixed(2) : 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="h-px bg-slate-700/50 my-4"></div>
            <div className="space-y-2">
              <Link
                to={`/portfolio/${id}/analytics`}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <TrendingUp size={18} />
                Analytics Dashboard
              </Link>
              <Link
                to={`/portfolio/${id}/live-trading`}
                className="flex items-center justify-center gap-2 w-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-white px-4 py-3 rounded-xl font-semibold transition-all"
              >
                Live Trading View
              </Link>
              {isManual && (
                <Link
                  to={`/portfolio/${id}/trade`}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
                >
                  <TrendingUp size={18} />
                  Place Trade
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* NAV Chart */}
          {snapshots.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <PerformanceChart snapshots={snapshots} />
            </div>
          )}

          {/* Holdings & Transactions */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-6 px-6 pt-6 border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('holdings')}
                className={`pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'holdings'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Holdings ({holdings.length})
                {activeTab === 'holdings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'transactions'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Transactions ({transactions.length})
                {activeTab === 'transactions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'holdings' && (
                holdings.length > 0 ? (
                  <HoldingsTable holdings={holdings} />
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-lg">No holdings yet</p>
                    <p className="text-sm mt-2">Start trading to build your portfolio</p>
                  </div>
                )
              )}

              {activeTab === 'transactions' && (
                transactions.length > 0 ? (
                  <TransactionHistory transactions={transactions} />
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <p className="text-lg">No transactions yet</p>
                    <p className="text-sm mt-2">Your trading history will appear here</p>
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
