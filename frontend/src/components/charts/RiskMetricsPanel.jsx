export default function RiskMetricsPanel({ riskMetrics }) {
  const var95 = riskMetrics.var_95 ? parseFloat(riskMetrics.var_95) : null;
  const var99 = riskMetrics.var_99 ? parseFloat(riskMetrics.var_99) : null;
  const drawdown = riskMetrics.current_drawdown ? parseFloat(riskMetrics.current_drawdown) : null;
  const liquidity = riskMetrics.liquidity_score ? parseFloat(riskMetrics.liquidity_score) : null;

  const getLiquidityColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (value) => {
    if (value >= 0) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Value at Risk 95% */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <p className="text-slate-400 text-sm uppercase">Value at Risk (95%)</p>
        <p className={`text-3xl font-bold mt-3 ${getRiskColor(var95)}`}>
          {var95 !== null ? var95.toFixed(2) : 'N/A'}%
        </p>
        <p className="text-slate-500 text-xs mt-3">
          95% confidence you won't lose more than this in 1 day
        </p>
      </div>

      {/* Value at Risk 99% */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <p className="text-slate-400 text-sm uppercase">Value at Risk (99%)</p>
        <p className={`text-3xl font-bold mt-3 ${getRiskColor(var99)}`}>
          {var99 !== null ? var99.toFixed(2) : 'N/A'}%
        </p>
        <p className="text-slate-500 text-xs mt-3">
          99% confidence you won't lose more than this in 1 day
        </p>
      </div>

      {/* Current Drawdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <p className="text-slate-400 text-sm uppercase">Current Drawdown</p>
        <p className={`text-3xl font-bold mt-3 ${getRiskColor(drawdown)}`}>
          {drawdown !== null ? drawdown.toFixed(2) : 'N/A'}%
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Current loss from recent peak
        </p>
      </div>

      {/* Liquidity Score */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <p className="text-slate-400 text-sm uppercase">Liquidity Score</p>
        <p className={`text-3xl font-bold mt-3 ${liquidity !== null ? getLiquidityColor(liquidity) : 'text-slate-400'}`}>
          {liquidity !== null ? liquidity.toFixed(0) : 'N/A'}
        </p>
        <p className="text-slate-500 text-xs mt-3">
          0-100: How easily you can liquidate
        </p>
      </div>
    </div>
  );
}
