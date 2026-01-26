import { useState, useEffect } from 'react';
import { portfolios, analytics } from '../services/api';
import PortfolioCard from './PortfolioCard';

export default function Dashboard() {
  const [portfolioList, setPortfolioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalNav, setTotalNav] = useState(0);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await portfolios.list(0, 100);
      setPortfolioList(response.data.portfolios);
      setTotalNav(response.data.total_nav);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading portfolios...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Trading Simulator</h1>
        <p className="text-slate-400">Portfolio Management & Backtesting</p>
      </div>

      {/* Stats */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Total NAV</p>
          <p className="text-3xl font-bold text-white mt-2">
            ${parseFloat(totalNav).toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Active Portfolios</p>
          <p className="text-3xl font-bold text-white mt-2">
            {portfolioList.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Portfolios</p>
          <p className="text-3xl font-bold text-white mt-2">{portfolioList.length}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-8 mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
          {error}
        </div>
      )}

      {/* Portfolios Grid */}
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Portfolios</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            + New Portfolio
          </button>
        </div>

        {portfolioList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No portfolios yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioList.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
