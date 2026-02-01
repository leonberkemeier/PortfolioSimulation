import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { analytics, portfolios } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import NAVChart from '../charts/NAVChart';
import AllocationPieChart from '../charts/AllocationPieChart';
import RiskMetricsPanel from '../charts/RiskMetricsPanel';
import PortfolioTypeIndicator from '../PortfolioTypeIndicator';

export default function AnalyticsDashboard() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [id]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch portfolio
      const portfolioRes = await portfolios.get(parseInt(id));
      setPortfolio(portfolioRes.data);

      // Fetch snapshots for chart
      try {
        const snapshotsRes = await analytics.snapshots(parseInt(id), 0, 100);
        setSnapshots(snapshotsRes.data.snapshots);
      } catch (e) {
        console.log('Snapshots not yet available');
      }

      // Fetch performance metrics
      try {
        const perfRes = await analytics.performance(parseInt(id));
        setPerformance(perfRes.data);
      } catch (e) {
        console.log('Performance metrics not yet available');
      }

      // Fetch risk metrics
      try {
        const riskRes = await analytics.risk(parseInt(id));
        setRiskMetrics(riskRes.data);
      } catch (e) {
        console.log('Risk metrics not yet available');
      }

      // Fetch allocation
      try {
        const allocRes = await analytics.allocation(parseInt(id));
        setAllocation(allocRes.data);
      } catch (e) {
        console.log('Allocation data not yet available');
      }
    } catch (err) {
      setError('Failed to load analytics data');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <Link to={`/portfolio/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-slate-400">{portfolio.name}</p>
          </div>
          <PortfolioTypeIndicator modelName={portfolio.model_name} />
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* NAV Chart Section */}
        {snapshots.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio Performance</h2>
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
              <NAVChart snapshots={snapshots} />
            </div>
          </div>
        )}

        {/* Performance Metrics + Allocation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Performance Metrics */}
          {performance && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Sharpe Ratio</span>
                  <span className="text-white font-semibold">
                    {performance.sharpe_ratio ? parseFloat(performance.sharpe_ratio).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Sortino Ratio</span>
                  <span className="text-white font-semibold">
                    {performance.sortino_ratio ? parseFloat(performance.sortino_ratio).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Max Drawdown</span>
                  <span className="text-red-400 font-semibold">
                    {performance.max_drawdown ? parseFloat(performance.max_drawdown).toFixed(2) : 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Volatility</span>
                  <span className="text-white font-semibold">
                    {performance.volatility ? parseFloat(performance.volatility).toFixed(2) : 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Win Rate</span>
                  <span className="text-green-400 font-semibold">
                    {performance.win_rate ? parseFloat(performance.win_rate).toFixed(2) : 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">Total Trades</span>
                  <span className="text-white font-semibold">{performance.total_trades || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Asset Allocation */}
          {allocation && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6">Asset Allocation</h2>
              <AllocationPieChart allocation={allocation} />
            </div>
          )}
        </div>

        {/* Risk Metrics Panel */}
        {riskMetrics && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Risk Analysis</h2>
            <RiskMetricsPanel riskMetrics={riskMetrics} />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <p className="text-slate-400 text-sm">NAV</p>
            <p className="text-3xl font-bold text-white mt-2">
              ${parseFloat(portfolio.nav).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <p className="text-slate-400 text-sm">Available Cash</p>
            <p className="text-3xl font-bold text-white mt-2">
              ${parseFloat(portfolio.current_cash).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <p className="text-slate-400 text-sm">Deployed Capital</p>
            <p className="text-3xl font-bold text-white mt-2">
              {portfolio.deployed_pct.toFixed(1)}%
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <p className="text-slate-400 text-sm">Total Return</p>
            <p className={`text-3xl font-bold mt-2 ${
              portfolio.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {portfolio.total_return_pct.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* No Data Message */}
        {!snapshots.length && !performance && !allocation && !riskMetrics && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-lg">
              No analytics data available yet. Start trading to generate performance data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
