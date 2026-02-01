import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { portfolios, analytics } from '../services/api';
import '../styles/AnalyticsDashboard.css';

export default function AnalyticsDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [id]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const portfolioResponse = await portfolios.getById(id);
      setPortfolio(portfolioResponse.data);

      try {
        const performanceResponse = await analytics.performance(id);
        setPerformance(performanceResponse.data);
      } catch (err) {
        console.log('Performance data not available');
      }

      try {
        const riskResponse = await analytics.risk(id);
        setRiskMetrics(riskResponse.data);
      } catch (err) {
        console.log('Risk metrics not available');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="loading-detail">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="analytics-dashboard">
        <div className="error-detail">
          <h3>Error</h3>
          <p>{error || 'Portfolio not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalReturn = parseFloat(portfolio.nav || 0) - parseFloat(portfolio.initial_capital || 0);
  const totalReturnPct = portfolio.total_return_pct || 0;

  return (
    <div className="analytics-dashboard">
      <button className="back-button" onClick={() => navigate(`/portfolio/${id}`)}>
        <ArrowLeft size={20} />
        Back to Portfolio
      </button>

      {/* Header */}
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>{portfolio.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <DollarSign size={28} color="white" />
            </div>
            <div className="metric-info">
              <h3>Total Value</h3>
            </div>
          </div>
          <div className="metric-value">
            {formatCurrency(parseFloat(portfolio.nav || 0))}
          </div>
          <div className={`metric-change ${totalReturnPct >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalReturnPct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {formatPercent(totalReturnPct)} since inception
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <TrendingUp size={28} color="white" />
            </div>
            <div className="metric-info">
              <h3>Total Return</h3>
            </div>
          </div>
          <div className={`metric-value ${totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(totalReturn)}
          </div>
          <div className="metric-change text-muted">
            Initial: {formatCurrency(parseFloat(portfolio.initial_capital || 0))}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <Activity size={28} color="white" />
            </div>
            <div className="metric-info">
              <h3>Sharpe Ratio</h3>
            </div>
          </div>
          <div className="metric-value">
            {riskMetrics?.sharpe_ratio?.toFixed(2) || 'N/A'}
          </div>
          <div className="metric-change text-muted">
            Risk-adjusted return
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <BarChart3 size={28} color="white" />
            </div>
            <div className="metric-info">
              <h3>Volatility</h3>
            </div>
          </div>
          <div className="metric-value">
            {riskMetrics?.volatility ? formatPercent(riskMetrics.volatility * 100) : 'N/A'}
          </div>
          <div className="metric-change text-muted">
            Annualized
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h2>
            <TrendingUp size={24} />
            Performance Over Time
          </h2>
          <div className="chart-wrapper">
            <div className="empty-state">
              <p>Performance chart will be displayed here</p>
              <p className="text-muted">Requires historical NAV data</p>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h2>
            <Activity size={24} />
            Risk Metrics
          </h2>
          {riskMetrics ? (
            <table className="risk-table">
              <tbody>
                <tr>
                  <td className="risk-label">Max Drawdown</td>
                  <td className="risk-value text-danger">
                    {riskMetrics.max_drawdown ? formatPercent(riskMetrics.max_drawdown * 100) : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="risk-label">Sharpe Ratio</td>
                  <td className="risk-value">
                    {riskMetrics.sharpe_ratio?.toFixed(2) || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="risk-label">Sortino Ratio</td>
                  <td className="risk-value">
                    {riskMetrics.sortino_ratio?.toFixed(2) || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="risk-label">Beta</td>
                  <td className="risk-value">
                    {riskMetrics.beta?.toFixed(2) || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="risk-label">Alpha</td>
                  <td className="risk-value text-success">
                    {riskMetrics.alpha ? formatPercent(riskMetrics.alpha * 100) : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>Risk metrics not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts */}
      <div className="chart-card full-width-chart">
        <h2>
          <PieChart size={24} />
          Asset Allocation
        </h2>
        <div className="chart-wrapper">
          <div className="empty-state">
            <p>Asset allocation chart will be displayed here</p>
            <p className="text-muted">Requires holdings data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
