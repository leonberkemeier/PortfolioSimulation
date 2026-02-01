import { useState, useEffect } from 'react';
import { portfolios } from '../../services/api';
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

  useEffect(() => {
    fetchAllPortfolios();
  }, []);

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

  if (loading) return <LoadingSpinner />;

  const modelNames = Object.keys(modelMetrics).sort();
  const hasModels = modelNames.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Model Comparison</h1>
        <p className="text-slate-400">Compare performance across trading models and manual portfolios</p>
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
            {/* Model Cards Grid */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
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
          </div>
        )}
      </div>
    </div>
  );
}
