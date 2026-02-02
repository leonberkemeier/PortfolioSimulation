import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Shield, TrendingUp, AlertTriangle, Target, ArrowLeft, Activity, Layers } from 'lucide-react';
import { analytics } from '../services/api';
import '../styles/PortfolioRiskDashboard.css';

const PortfolioRiskDashboard = () => {
  const { id } = useParams();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = {
    sectors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
    assets: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    risk: {
      low: '#10b981',
      moderate: '#f59e0b',
      high: '#ef4444'
    }
  };

  useEffect(() => {
    fetchRiskAnalysis();
  }, [id]);

  const fetchRiskAnalysis = async () => {
    try {
      setLoading(true);
      const response = await analytics.riskAnalysis(id);
      setRiskData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching risk analysis:', err);
      setError(err.response?.data?.detail || 'Failed to load risk analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (assessment) => {
    const lower = assessment.toLowerCase();
    if (lower.includes('excellent') || lower.includes('low')) return COLORS.risk.low;
    if (lower.includes('good') || lower.includes('moderate')) return COLORS.risk.moderate;
    return COLORS.risk.high;
  };

  const getDiversificationColor = (score) => {
    if (score >= 80) return COLORS.risk.low;
    if (score >= 60) return COLORS.risk.moderate;
    return COLORS.risk.high;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="risk-dashboard loading">
        <div className="spinner"></div>
        <p>Loading risk analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-dashboard error">
        <AlertTriangle size={48} />
        <h2>Error Loading Risk Analysis</h2>
        <p>{error}</p>
        <Link to={`/portfolio/${id}`} className="back-btn">
          <ArrowLeft size={18} />
          Back to Portfolio
        </Link>
      </div>
    );
  }

  if (!riskData) return null;

  return (
    <div className="risk-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <Link to={`/portfolio/${id}`} className="back-link">
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>
        <div className="header-content">
          <h1>
            <Shield size={32} />
            Risk Analysis: {riskData.portfolio_name}
          </h1>
          <p className="portfolio-value">
            Total Value: <strong>${riskData.total_value.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: getDiversificationColor(riskData.portfolio_metrics.diversification_score) }}>
            <Target size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Diversification Score</span>
            <span className="metric-value">{riskData.portfolio_metrics.diversification_score}/100</span>
            <span className="metric-assessment" style={{ color: getDiversificationColor(riskData.portfolio_metrics.diversification_score) }}>
              {riskData.risk_assessment.diversification}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: getRiskColor(riskData.risk_assessment.volatility) }}>
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Portfolio Volatility</span>
            <span className="metric-value">
              {riskData.portfolio_metrics.volatility_pct ? `${riskData.portfolio_metrics.volatility_pct}%` : 'N/A'}
            </span>
            <span className="metric-assessment" style={{ color: getRiskColor(riskData.risk_assessment.volatility) }}>
              {riskData.risk_assessment.volatility}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: getRiskColor(riskData.risk_assessment.concentration) }}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Concentration Risk</span>
            <span className="metric-value">{riskData.portfolio_metrics.concentration_ratio.toFixed(1)}%</span>
            <span className="metric-assessment" style={{ color: getRiskColor(riskData.risk_assessment.concentration) }}>
              {riskData.risk_assessment.concentration}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#3b82f6' }}>
            <Layers size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Holdings & Sectors</span>
            <span className="metric-value">
              {riskData.portfolio_metrics.number_of_holdings} / {riskData.portfolio_metrics.number_of_sectors}
            </span>
            <span className="metric-assessment">Holdings / Sectors</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sector Allocation Pie Chart */}
        {riskData.sector_allocation.length > 0 && (
          <div className="chart-card">
            <h3>Sector Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData.sector_allocation}
                  dataKey="percentage"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ sector, percentage }) => `${sector}: ${percentage.toFixed(1)}%`}
                >
                  {riskData.sector_allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.sectors[index % COLORS.sectors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Asset Allocation Pie Chart */}
        <div className="chart-card">
          <h3>Asset Type Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData.asset_allocation}
                dataKey="percentage"
                nameKey="asset_type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ asset_type, percentage }) => `${asset_type}: ${percentage.toFixed(1)}%`}
              >
                {riskData.asset_allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.assets[index % COLORS.assets.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Holdings Volatility Chart */}
        {riskData.holdings_risk.length > 0 && (
          <div className="chart-card wide">
            <h3>Individual Holdings Risk</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskData.holdings_risk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="symbol" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" label={{ value: 'Volatility %', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="volatility_pct" fill="#3b82f6" name="Volatility %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk-Return Scatter (Volatility vs Weight) */}
        {riskData.holdings_risk.length > 0 && (
          <div className="chart-card wide">
            <h3>Risk vs Portfolio Weight</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="weight_pct"
                  name="Portfolio Weight %"
                  stroke="#9ca3af"
                  label={{ value: 'Portfolio Weight %', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  dataKey="volatility_pct"
                  name="Volatility %"
                  stroke="#9ca3af"
                  label={{ value: 'Volatility %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label">{data.symbol}</p>
                          <p className="tooltip-item">Weight: {data.weight_pct.toFixed(2)}%</p>
                          <p className="tooltip-item">Volatility: {data.volatility_pct.toFixed(2)}%</p>
                          {data.beta && <p className="tooltip-item">Beta: {data.beta.toFixed(2)}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={riskData.holdings_risk} fill="#3b82f6">
                  {riskData.holdings_risk.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.sectors[index % COLORS.sectors.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Holdings Table */}
      <div className="table-card">
        <h3>Top Holdings (Concentration Risk)</h3>
        <div className="holdings-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Symbol</th>
                <th>Portfolio Weight</th>
                <th>Risk Impact</th>
              </tr>
            </thead>
            <tbody>
              {riskData.top_holdings.map((holding, index) => (
                <tr key={holding.symbol}>
                  <td className="rank">#{index + 1}</td>
                  <td className="symbol">{holding.symbol}</td>
                  <td className="weight">
                    <div className="weight-bar-container">
                      <div
                        className="weight-bar"
                        style={{
                          width: `${holding.weight_pct}%`,
                          background: holding.weight_pct > 20 ? COLORS.risk.high : holding.weight_pct > 10 ? COLORS.risk.moderate : COLORS.risk.low
                        }}
                      />
                      <span>{holding.weight_pct.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="impact">
                    {holding.weight_pct > 20 ? (
                      <span className="badge high">High</span>
                    ) : holding.weight_pct > 10 ? (
                      <span className="badge moderate">Moderate</span>
                    ) : (
                      <span className="badge low">Low</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Matrix */}
      {Object.keys(riskData.correlation_matrix).length > 0 && (
        <div className="table-card">
          <h3>Correlation Matrix</h3>
          <p className="table-description">
            Shows how holdings move together. Values closer to 1 indicate strong positive correlation (move together),
            closer to -1 indicate negative correlation (move opposite), and closer to 0 indicate no correlation.
          </p>
          <div className="correlation-matrix">
            <table>
              <thead>
                <tr>
                  <th></th>
                  {Object.keys(riskData.correlation_matrix).map(symbol => (
                    <th key={symbol}>{symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(riskData.correlation_matrix).map(([symbol1, correlations]) => (
                  <tr key={symbol1}>
                    <th>{symbol1}</th>
                    {Object.keys(riskData.correlation_matrix).map(symbol2 => {
                      const value = correlations[symbol2];
                      const intensity = Math.abs(value);
                      const color = value > 0.7 ? COLORS.risk.high :
                                   value > 0.3 ? COLORS.risk.moderate :
                                   COLORS.risk.low;
                      return (
                        <td
                          key={symbol2}
                          className="correlation-cell"
                          style={{
                            background: `linear-gradient(135deg, ${color}${Math.floor(intensity * 40)}, transparent)`,
                            fontWeight: intensity > 0.7 ? 'bold' : 'normal'
                          }}
                        >
                          {value !== undefined ? value.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holdings Risk Details */}
      {riskData.holdings_risk.length > 0 && (
        <div className="table-card">
          <h3>Holdings Risk Details</h3>
          <div className="holdings-table">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Asset Type</th>
                  <th>Volatility</th>
                  <th>Beta</th>
                  <th>Portfolio Weight</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {riskData.holdings_risk
                  .sort((a, b) => b.weight_pct - a.weight_pct)
                  .map((holding) => (
                    <tr key={holding.symbol}>
                      <td className="symbol">{holding.symbol}</td>
                      <td>{holding.asset_type}</td>
                      <td>
                        <span
                          className="volatility-badge"
                          style={{
                            color: holding.volatility_pct > 30 ? COLORS.risk.high :
                                   holding.volatility_pct > 20 ? COLORS.risk.moderate :
                                   COLORS.risk.low
                          }}
                        >
                          {holding.volatility_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td>{holding.beta ? holding.beta.toFixed(2) : 'N/A'}</td>
                      <td>{holding.weight_pct.toFixed(2)}%</td>
                      <td>${holding.value.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRiskDashboard;
