import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import IntradayChart from '../charts/IntradayChart';

export default function LiveTradingView() {
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/live-trading/dashboard/${id}`
        );
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load live trading dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
    
    // Auto-refresh every 60 seconds if enabled
    if (autoRefresh) {
      const refreshInterval = setInterval(fetchDashboard, 60000);
      return () => clearInterval(refreshInterval);
    }
  }, [id, autoRefresh]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return null;
  
  const { portfolio, holdings } = dashboardData;
  
  // Sort holdings by unrealized P&L (biggest gainers first)
  const topHoldings = [...holdings].sort(
    (a, b) => b.unrealized_pnl - a.unrealized_pnl
  ).slice(0, 3);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <Link to={`/portfolio/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Live Trading View</h1>
        <p className="text-slate-400">{portfolio.name}</p>
      </div>
      
      {/* Top Info Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Current Time */}
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-400" />
            <div>
              <p className="text-slate-400 text-sm">Current Time</p>
              <p className="text-2xl font-bold text-white font-mono">
                {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {/* Market Status */}
          <div>
            <p className="text-slate-400 text-sm">Market Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${
                dashboardData.market_status === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <p className="text-xl font-bold text-white">
                {dashboardData.market_status}
              </p>
            </div>
          </div>
          
          {/* Portfolio Value (Real-time) */}
          <div>
            <p className="text-slate-400 text-sm">Portfolio Value (Real-time)</p>
            <p className="text-2xl font-bold text-white mt-1">
              ${dashboardData.real_time_portfolio_value.toFixed(2)}
            </p>
            <p className={`text-sm mt-1 ${
              dashboardData.total_unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {dashboardData.total_unrealized_pnl >= 0 ? '↑' : '↓'} ${Math.abs(dashboardData.total_unrealized_pnl).toFixed(2)}
            </p>
          </div>
          
          {/* Portfolio Stats */}
          <div>
            <p className="text-slate-400 text-sm">NAV</p>
            <p className="text-xl font-bold text-white mt-1">
              ${portfolio.nav.toFixed(2)}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Cash: ${portfolio.current_cash.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-8">
        {/* Featured Holdings (Top 3) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Top Holdings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topHoldings.map((holding) => (
              <div key={holding.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{holding.ticker}</h3>
                    <p className="text-slate-400 text-sm">{holding.quantity} shares</p>
                  </div>
                  <div className={`text-right ${
                    holding.daily_change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {holding.daily_change_pct >= 0 ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                </div>
                
                {/* Current Price */}
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white">
                    ${holding.current_price.toFixed(2)}
                  </p>
                  <p className={`text-lg font-semibold mt-1 ${
                    holding.daily_change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {holding.daily_change_pct >= 0 ? '+' : ''}{holding.daily_change_pct.toFixed(2)}% (intraday)
                  </p>
                </div>
                
                {/* Mini Chart */}
                <div className="mb-4">
                  <IntradayChart data={holding.intraday_data.chart_data} height={150} />
                </div>
                
                {/* Unrealized P&L */}
                <div className={`p-3 rounded bg-slate-700 text-center ${
                  holding.unrealized_pnl >= 0 ? 'border border-green-900' : 'border border-red-900'
                }`}>
                  <p className="text-slate-400 text-sm">Unrealized P&L</p>
                  <p className={`text-xl font-bold mt-1 ${
                    holding.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${holding.unrealized_pnl.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Full Holdings Table */}
        {holdings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">All Holdings</h2>
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr className="text-slate-300">
                    <th className="text-left py-3 px-4 font-semibold">Ticker</th>
                    <th className="text-right py-3 px-4 font-semibold">Shares</th>
                    <th className="text-right py-3 px-4 font-semibold">Entry Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Current Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Daily %</th>
                    <th className="text-right py-3 px-4 font-semibold">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, idx) => (
                    <tr key={holding.id} className={`border-b border-slate-700 ${
                      idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'
                    } hover:bg-slate-700 transition`}>
                      <td className="py-3 px-4 text-white font-semibold">{holding.ticker}</td>
                      <td className="py-3 px-4 text-right text-white">{holding.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-300">${holding.entry_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">${holding.current_price.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        holding.daily_change_pct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {holding.daily_change_pct >= 0 ? '+' : ''}{holding.daily_change_pct.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        holding.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${holding.unrealized_pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Auto-refresh Toggle */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-400">
              Auto-refresh every 60 seconds
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
