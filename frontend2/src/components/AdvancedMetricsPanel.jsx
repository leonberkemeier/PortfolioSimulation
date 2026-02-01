import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, BarChart2 } from 'lucide-react';
import api from '../services/api';
import '../styles/AdvancedMetrics.css';

export default function AdvancedMetricsPanel({ portfolioId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, [portfolioId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/${portfolioId}/advanced-metrics`);
      setMetrics(response.data);
    } catch (err) {
      console.error('Error fetching advanced metrics:', err);
      setError(err.response?.data?.detail || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return 'success';
      case 'MODERATE': return 'warning';
      case 'HIGH': return 'danger';
      case 'VERY HIGH': return 'danger';
      default: return 'neutral';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'LOW':
        return <CheckCircle className="text-success" />;
      case 'MODERATE':
        return <AlertTriangle className="text-warning" />;
      case 'HIGH':
      case 'VERY HIGH':
        return <AlertTriangle className="text-danger" />;
      default:
        return <Activity />;
    }
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="metrics-loading">
        <div className="spinner"></div>
        <p>Calculating advanced metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-error">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <p className="error-hint">Need at least 2 days of portfolio history</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="advanced-metrics-panel">
      <div className="metrics-header">
        <h2>
          <BarChart2 size={24} />
          Advanced Performance Metrics
        </h2>
        <div className={`risk-badge risk-${getRiskColor(metrics.risk_assessment)}`}>
          {getRiskIcon(metrics.risk_assessment)}
          <span>{metrics.risk_assessment} RISK</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        {/* Sharpe Ratio */}
        <div className="metric-card">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value">
            {formatNumber(metrics.metrics.risk_adjusted.sharpe_ratio)}
          </div>
          <div className="metric-description">
            Risk-adjusted returns
          </div>
          <div className={`metric-interpretation ${metrics.interpretation.sharpe.includes('Excellent') ? 'positive' : metrics.interpretation.sharpe.includes('Good') ? 'neutral' : 'negative'}`}>
            {metrics.interpretation.sharpe}
          </div>
        </div>

        {/* Sortino Ratio */}
        <div className="metric-card">
          <div className="metric-label">Sortino Ratio</div>
          <div className="metric-value">
            {formatNumber(metrics.metrics.risk_adjusted.sortino_ratio)}
          </div>
          <div className="metric-description">
            Downside risk-adjusted returns
          </div>
          <div className="metric-interpretation neutral">
            Higher is better
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="metric-card">
          <div className="metric-label">Maximum Drawdown</div>
          <div className="metric-value text-danger">
            {formatPercent(metrics.metrics.risk.max_drawdown_pct)}
          </div>
          <div className="metric-description">
            Worst peak-to-trough decline
          </div>
          <div className={`metric-interpretation ${metrics.interpretation.max_drawdown.includes('Low') ? 'positive' : metrics.interpretation.max_drawdown.includes('Moderate') ? 'neutral' : 'negative'}`}>
            {metrics.interpretation.max_drawdown}
          </div>
        </div>

        {/* Calmar Ratio */}
        <div className="metric-card">
          <div className="metric-label">Calmar Ratio</div>
          <div className="metric-value">
            {formatNumber(metrics.metrics.risk_adjusted.calmar_ratio)}
          </div>
          <div className="metric-description">
            Return per unit of drawdown
          </div>
          <div className="metric-interpretation neutral">
            Higher is better
          </div>
        </div>

        {/* Volatility */}
        <div className="metric-card">
          <div className="metric-label">Volatility</div>
          <div className="metric-value">
            {formatPercent(metrics.metrics.risk.volatility_pct)}
          </div>
          <div className="metric-description">
            Annualized standard deviation
          </div>
          <div className="metric-interpretation neutral">
            Lower is more stable
          </div>
        </div>

        {/* Value at Risk 95% */}
        <div className="metric-card">
          <div className="metric-label">VaR (95%)</div>
          <div className="metric-value text-danger">
            {formatPercent(metrics.metrics.risk.value_at_risk_95_pct)}
          </div>
          <div className="metric-description">
            5% chance of worse loss
          </div>
          <div className="metric-interpretation neutral">
            Daily value at risk
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="metrics-details">
        <div className="detail-section">
          <h3>
            <TrendingUp size={20} />
            Return Analysis
          </h3>
          <div className="detail-row">
            <span>Total Return:</span>
            <strong className={metrics.metrics.returns.total_return_pct >= 0 ? 'text-success' : 'text-danger'}>
              {formatPercent(metrics.metrics.returns.total_return_pct)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Start Value:</span>
            <strong>${metrics.start_value.toLocaleString()}</strong>
          </div>
          <div className="detail-row">
            <span>Current Value:</span>
            <strong>${metrics.current_value.toLocaleString()}</strong>
          </div>
        </div>

        <div className="detail-section">
          <h3>
            <TrendingDown size={20} />
            Drawdown Analysis
          </h3>
          <div className="detail-row">
            <span>Maximum Drawdown:</span>
            <strong className="text-danger">{formatPercent(metrics.metrics.risk.max_drawdown_pct)}</strong>
          </div>
          <div className="detail-row">
            <span>Current Drawdown:</span>
            <strong className={Math.abs(metrics.metrics.risk.current_drawdown_pct) < 5 ? 'text-success' : 'text-danger'}>
              {formatPercent(metrics.metrics.risk.current_drawdown_pct)}
            </strong>
          </div>
        </div>

        {metrics.metrics.market_comparison.beta && (
          <div className="detail-section">
            <h3>
              <BarChart2 size={20} />
              Market Comparison
            </h3>
            <div className="detail-row">
              <span>Alpha:</span>
              <strong className={metrics.metrics.market_comparison.alpha_pct >= 0 ? 'text-success' : 'text-danger'}>
                {formatPercent(metrics.metrics.market_comparison.alpha_pct)}
              </strong>
            </div>
            <div className="detail-row">
              <span>Beta:</span>
              <strong>{formatNumber(metrics.metrics.market_comparison.beta)}</strong>
            </div>
            <div className="detail-hint">
              Alpha: Excess return vs market • Beta: Market sensitivity
            </div>
          </div>
        )}
      </div>

      {/* Metrics Guide */}
      <div className="metrics-guide">
        <h4>Understanding These Metrics</h4>
        <div className="guide-grid">
          <div>
            <strong>Sharpe Ratio:</strong> Measures return per unit of total risk. Above 1.0 is good, above 2.0 is excellent.
          </div>
          <div>
            <strong>Sortino Ratio:</strong> Like Sharpe, but only penalizes downside volatility. Better for asymmetric returns.
          </div>
          <div>
            <strong>Max Drawdown:</strong> Your worst-case scenario. Shows the maximum loss from a peak.
          </div>
          <div>
            <strong>Calmar Ratio:</strong> Annual return divided by max drawdown. Higher means better return for the pain endured.
          </div>
          <div>
            <strong>Volatility:</strong> Standard deviation of returns. Lower means more stable, but potentially lower growth.
          </div>
          <div>
            <strong>VaR (Value at Risk):</strong> Maximum expected loss at 95% confidence. Only a 5% chance you'll lose more in a day.
          </div>
        </div>
      </div>
    </div>
  );
}
