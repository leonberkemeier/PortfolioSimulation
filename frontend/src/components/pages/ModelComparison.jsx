import { useState, useEffect } from 'react';
import { portfolios, models, screener } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import ModelCard from '../tables/ModelCard';
import ModelPerformanceTable from '../tables/ModelPerformanceTable';

export default function ModelComparison() {
  const [allPortfolios, setAllPortfolios] = useState([]);
  const [modelMetrics, setModelMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // New state for enhanced features
  const [modelAnalytics, setModelAnalytics] = useState(null);
  const [screenerStats, setScreenerStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, signals, screener

  useEffect(() => {
    fetchAllPortfolios();
    fetchScreenerStats();
  }, []);
  
  useEffect(() => {
    if (selectedModel) {
      fetchModelAnalytics(selectedModel);
    }
  }, [selectedModel]);

  const fetchAllPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all portfolios (use high limit to get all)
      const res = await portfolios.list(0, 1000);
      const allPorts = res.data.portfolios;
      setAllPortfolios(allPorts);

      // Group by model and calculate metrics
      const metrics = {};
      
      allPorts.forEach((portfolio) => {
        const modelName = portfolio.model_name || 'Manual Portfolios';
        
        if (!metrics[modelName]) {
          metrics[modelName] = {
            modelName,
            portfolios: [],
            totalNav: 0,
            totalReturn: 0,
            portfolioCount: 0,
            avgReturn: 0,
            totalPnL: 0,
          };
        }

        metrics[modelName].portfolios.push(portfolio);
        metrics[modelName].portfolioCount += 1;
        metrics[modelName].totalNav += parseFloat(portfolio.nav);
        metrics[modelName].totalReturn += portfolio.total_return_pct;
        metrics[modelName].totalPnL += 
          parseFloat(portfolio.nav) - parseFloat(portfolio.initial_capital);
      });

      // Calculate averages
      Object.keys(metrics).forEach((modelName) => {
        const data = metrics[modelName];
        data.avgReturn = data.portfolioCount > 0 ? data.totalReturn / data.portfolioCount : 0;
      });

      setModelMetrics(metrics);
      
      // Set first model as selected by default
      const modelNames = Object.keys(metrics);
      if (modelNames.length > 0) {
        setSelectedModel(modelNames[0]);
      }
    } catch (err) {
      setError('Failed to load portfolio data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchModelAnalytics = async (modelName) => {
    try {
      const res = await models.analytics(modelName, 20);
      setModelAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch model analytics:', err);
      setModelAnalytics(null);
    }
  };
  
  const fetchScreenerStats = async () => {
    try {
      const res = await screener.stats({ limit: 15 });
      setScreenerStats(res.data);
    } catch (err) {
      console.error('Failed to fetch screener stats:', err);
      setScreenerStats(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const modelNames = Object.keys(modelMetrics).sort();
  const hasModels = modelNames.length > 0;

  // Helper: Format signal type badge
  const SignalBadge = ({ type }) => {
    const colors = {
      buy: 'bg-green-900 text-green-200',
      BUY: 'bg-green-900 text-green-200',
      sell: 'bg-red-900 text-red-200',
      SELL: 'bg-red-900 text-red-200',
      hold: 'bg-yellow-900 text-yellow-200',
      HOLD: 'bg-yellow-900 text-yellow-200',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[type] || 'bg-slate-700 text-slate-300'}`}>
        {type?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Model Comparison</h1>
        <p className="text-slate-400">Compare performance across trading models and manual portfolios</p>
        
        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-4">
          {['overview', 'signals', 'screener'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && <ErrorMessage message={error} />}

        {!hasModels ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No portfolios found</p>
          </div>
        ) : (
          <div>
            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === 'overview' && (
              <>
                {/* Model Cards Grid */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Model Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modelNames.map((modelName) => (
                      <ModelCard
                        key={modelName}
                        metrics={modelMetrics[modelName]}
                        isSelected={selectedModel === modelName}
                        onSelect={() => setSelectedModel(modelName)}
                      />
                    ))}
                  </div>
                </div>

                {/* Performance Table */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Detailed Comparison</h2>
                  <ModelPerformanceTable metrics={modelMetrics} modelNames={modelNames} />
                </div>

                {/* Selected Model Details */}
                {selectedModel && modelMetrics[selectedModel] && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      {selectedModel} - Portfolios ({modelMetrics[selectedModel].portfolioCount})
                    </h2>

                    {modelMetrics[selectedModel].portfolios.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-slate-700">
                            <tr className="text-slate-400">
                              <th className="text-left py-3 px-4 font-semibold">Portfolio Name</th>
                              <th className="text-right py-3 px-4 font-semibold">NAV</th>
                              <th className="text-right py-3 px-4 font-semibold">Initial Capital</th>
                              <th className="text-right py-3 px-4 font-semibold">Return %</th>
                              <th className="text-right py-3 px-4 font-semibold">P&L</th>
                              <th className="text-right py-3 px-4 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelMetrics[selectedModel].portfolios.map((port) => {
                              const returnColor = port.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400';
                              const pnl = parseFloat(port.nav) - parseFloat(port.initial_capital);
                              const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';

                              return (
                                <tr key={port.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                                  <td className="py-3 px-4 text-white font-semibold">{port.name}</td>
                                  <td className="py-3 px-4 text-right text-white">
                                    ${parseFloat(port.nav).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-300">
                                    ${parseFloat(port.initial_capital).toFixed(2)}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-semibold ${returnColor}`}>
                                    {port.total_return_pct.toFixed(2)}%
                                  </td>
                                  <td className={`py-3 px-4 text-right font-semibold ${pnlColor}`}>
                                    ${pnl.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs font-semibold">
                                      {port.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No portfolios for this model</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm">Total Models</p>
                    <p className="text-3xl font-bold text-white mt-2">{modelNames.length}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm">Total Portfolios</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {modelNames.reduce((sum, m) => sum + modelMetrics[m].portfolioCount, 0)}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm">Combined NAV</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      ${modelNames.reduce((sum, m) => sum + modelMetrics[m].totalNav, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <p className="text-slate-400 text-sm">Combined P&L</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                      ${modelNames.reduce((sum, m) => sum + modelMetrics[m].totalPnL, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ====== SIGNALS TAB ====== */}
            {activeTab === 'signals' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Model Selector */}
                <div className="lg:col-span-1">
                  <h2 className="text-2xl font-bold text-white mb-4">Select Model</h2>
                  <div className="space-y-2">
                    {modelNames.filter(m => m !== 'Manual Portfolios').map((modelName) => (
                      <button
                        key={modelName}
                        onClick={() => setSelectedModel(modelName)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition ${
                          selectedModel === modelName
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {modelName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signal Analytics */}
                <div className="lg:col-span-2">
                  {modelAnalytics ? (
                    <>
                      {/* Model Stats */}
                      <h2 className="text-2xl font-bold text-white mb-4">{selectedModel} Analytics</h2>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <p className="text-slate-400 text-sm">Total Signals</p>
                          <p className="text-2xl font-bold text-white">{modelAnalytics.total_signals}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <p className="text-slate-400 text-sm">Win Rate</p>
                          <p className="text-2xl font-bold text-green-400">
                            {modelAnalytics.win_rate?.toFixed(1) || 'N/A'}%
                          </p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <p className="text-slate-400 text-sm">Total Trades</p>
                          <p className="text-2xl font-bold text-white">{modelAnalytics.total_trades}</p>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <p className="text-slate-400 text-sm">Profit Factor</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {modelAnalytics.profit_factor?.toFixed(2) || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Signal Breakdown */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
                          <p className="text-green-300 text-sm">Buy Signals</p>
                          <p className="text-2xl font-bold text-green-400">{modelAnalytics.buy_signals}</p>
                        </div>
                        <div className="bg-red-900/30 rounded-lg p-4 border border-red-700">
                          <p className="text-red-300 text-sm">Sell Signals</p>
                          <p className="text-2xl font-bold text-red-400">{modelAnalytics.sell_signals}</p>
                        </div>
                        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
                          <p className="text-yellow-300 text-sm">Hold Signals</p>
                          <p className="text-2xl font-bold text-yellow-400">{modelAnalytics.hold_signals}</p>
                        </div>
                      </div>

                      {/* Recent Signals */}
                      {modelAnalytics.recent_signals?.length > 0 && (
                        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Recent Signals</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {modelAnalytics.recent_signals.map((signal) => (
                              <div key={signal.id} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                                <div className="flex items-center space-x-3">
                                  <SignalBadge type={signal.signal_type} />
                                  <span className="text-white font-semibold">{signal.ticker}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-slate-400 text-sm">
                                    Confidence: {signal.confidence?.toFixed(0)}%
                                  </span>
                                  <span className="text-slate-500 text-xs">
                                    {new Date(signal.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Holdings */}
                      {modelAnalytics.position_tickers?.length > 0 && (
                        <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Current Positions ({modelAnalytics.current_positions})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {modelAnalytics.position_tickers.map((ticker) => (
                              <span key={ticker} className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">
                                {ticker}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>Select a model to view signal analytics</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== SCREENER TAB ====== */}
            {activeTab === 'screener' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Stock Screener Opportunities</h2>
                
                {screenerStats ? (
                  <>
                    {/* Screener Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <p className="text-slate-400 text-sm">Dividend Opportunities</p>
                        <p className="text-3xl font-bold text-green-400">{screenerStats.dividend_count}</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <p className="text-slate-400 text-sm">Volatility Opportunities</p>
                        <p className="text-3xl font-bold text-yellow-400">{screenerStats.volatility_count}</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <p className="text-slate-400 text-sm">Combined (Both)</p>
                        <p className="text-3xl font-bold text-blue-400">{screenerStats.combined_count}</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <p className="text-slate-400 text-sm">Last Scan</p>
                        <p className="text-lg font-semibold text-white">{screenerStats.last_scan_date || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Dividend Stocks */}
                      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-green-400 mb-4">🏆 Top Dividend Stocks</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {screenerStats.dividend_opportunities?.slice(0, 10).map((opp) => (
                            <div key={opp.ticker} className="flex items-center justify-between bg-slate-900 rounded p-3">
                              <span className="text-white font-semibold">{opp.ticker}</span>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-green-400">
                                  Yield: {(opp.dividend_yield * 100).toFixed(1)}%
                                </span>
                                <span className="text-slate-400">
                                  P/E: {opp.pe_ratio?.toFixed(1) || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {screenerStats.dividend_opportunities?.length === 0 && (
                            <p className="text-slate-400 text-center py-4">No dividend opportunities found</p>
                          )}
                        </div>
                      </div>

                      {/* Volatility Stocks */}
                      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4">⚡ High Volatility Stocks</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {screenerStats.volatility_opportunities?.slice(0, 10).map((opp) => (
                            <div key={opp.ticker} className="flex items-center justify-between bg-slate-900 rounded p-3">
                              <span className="text-white font-semibold">{opp.ticker}</span>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-yellow-400">
                                  Vol: {(opp.historical_volatility * 100).toFixed(0)}%
                                </span>
                                <span className="text-slate-400">
                                  %ile: {opp.volatility_percentile?.toFixed(0) || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {screenerStats.volatility_opportunities?.length === 0 && (
                            <p className="text-slate-400 text-center py-4">No volatility opportunities found</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Combined Opportunities */}
                    {screenerStats.combined_opportunities?.length > 0 && (
                      <div className="mt-8 bg-slate-800 rounded-lg border border-blue-700 p-6">
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">💎 Combined Opportunities (Dividend + Volatility)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {screenerStats.combined_opportunities.map((opp) => (
                            <div key={opp.ticker} className="bg-slate-900 rounded-lg p-4">
                              <p className="text-white font-bold text-lg">{opp.ticker}</p>
                              <div className="mt-2 space-y-1 text-sm">
                                <p className="text-green-400">Yield: {(opp.dividend_yield * 100).toFixed(1)}%</p>
                                <p className="text-yellow-400">Vol: {(opp.historical_volatility * 100).toFixed(0)}%</p>
                                <p className="text-slate-400">P/E: {opp.pe_ratio?.toFixed(1) || 'N/A'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Loading screener data...</p>
                    <p className="text-slate-500 text-sm mt-2">Make sure the stock-screener database is available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
