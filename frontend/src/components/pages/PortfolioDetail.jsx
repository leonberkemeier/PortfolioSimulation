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

      {/* Stats Grid */}
      <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">NAV</p>
          <p className="text-2xl font-bold text-white mt-2">
            ${parseFloat(portfolio.nav).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Initial Capital</p>
          <p className="text-2xl font-bold text-white mt-2">
            ${parseFloat(portfolio.initial_capital).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Available Cash</p>
          <p className="text-2xl font-bold text-white mt-2">
            ${parseFloat(portfolio.current_cash).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Return</p>
          <p className={`text-2xl font-bold mt-2 ${returnColor}`}>
            {portfolio.total_return_pct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="px-8 pb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs uppercase">Sharpe Ratio</p>
              <p className="text-xl font-bold text-white mt-2">
                {performance.sharpe_ratio ? parseFloat(performance.sharpe_ratio).toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs uppercase">Sortino Ratio</p>
              <p className="text-xl font-bold text-white mt-2">
                {performance.sortino_ratio ? parseFloat(performance.sortino_ratio).toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs uppercase">Max Drawdown</p>
              <p className="text-xl font-bold text-red-400 mt-2">
                {performance.max_drawdown ? parseFloat(performance.max_drawdown).toFixed(2) : 'N/A'}%
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs uppercase">Volatility</p>
              <p className="text-xl font-bold text-white mt-2">
                {performance.volatility ? parseFloat(performance.volatility).toFixed(2) : 'N/A'}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NAV Chart */}
      {snapshots.length > 0 && (
        <div className="px-8 pb-8">
          <h2 className="text-2xl font-bold text-white mb-4">NAV History</h2>
          <PerformanceChart snapshots={snapshots} />
        </div>
      )}

      {/* Tabs */}
      <div className="px-8 pb-8">
        <div className="flex gap-4 border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'holdings'
                ? 'border-blue-600 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <div>
            {holdings.length > 0 ? (
              <HoldingsTable holdings={holdings} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No holdings yet</p>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length > 0 ? (
              <TransactionHistory transactions={transactions} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isManual && (
        <div className="px-8 pb-8">
          <Link
            to={`/portfolio/${id}/trade`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Place Trade
          </Link>
        </div>
      )}
    </div>
  );
}
