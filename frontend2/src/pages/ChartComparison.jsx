import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Plus, X, BarChart3, Calendar } from 'lucide-react';
import { analytics } from '../services/api';
import '../styles/ChartComparison.css';

const ChartComparison = () => {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT']); // Default symbols
  const [newSymbol, setNewSymbol] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('1mo');
  const [interval, setInterval] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Color palette for different symbols
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];

  const periods = [
    { value: '1d', label: 'Day' },
    { value: '5d', label: 'Week' },
    { value: '1mo', label: 'Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: 'Year' },
    { value: '2y', label: '2 Years' },
    { value: '5y', label: '5 Years' },
  ];

  const intervals = [
    { value: '1m', label: '1 min', periods: ['1d'] },
    { value: '5m', label: '5 min', periods: ['1d', '5d'] },
    { value: '15m', label: '15 min', periods: ['1d', '5d'] },
    { value: '1h', label: '1 hour', periods: ['1d', '5d', '1mo'] },
    { value: '1d', label: '1 day', periods: ['1mo', '3mo', '6mo', '1y', '2y', '5y'] },
    { value: '1wk', label: '1 week', periods: ['1y', '2y', '5y'] },
  ];

  // Get valid intervals for current period
  const getValidIntervals = () => {
    return intervals.filter(int => int.periods.includes(period));
  };

  useEffect(() => {
    if (symbols.length > 0) {
      fetchComparisonData();
    }
  }, [symbols, period, interval]);

  const fetchComparisonData = async () => {
    if (symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analytics.compare(symbols, period, interval);
      setComparisonData(response.data);

      // Transform data for Recharts
      // We need to merge all symbol data by date
      const dateMap = new Map();

      response.data.data.forEach((symbolData) => {
        symbolData.data.forEach((point) => {
          if (!dateMap.has(point.date)) {
            dateMap.set(point.date, { date: point.date });
          }
          dateMap.get(point.date)[symbolData.symbol] = point.pct_change;
        });
      });

      const mergedData = Array.from(dateMap.values()).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

      setChartData(mergedData);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setError(err.response?.data?.detail || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbol = (e) => {
    e.preventDefault();
    const trimmedSymbol = newSymbol.trim().toUpperCase();

    if (!trimmedSymbol) return;

    if (symbols.includes(trimmedSymbol)) {
      setError(`${trimmedSymbol} is already in the comparison`);
      return;
    }

    if (symbols.length >= 10) {
      setError('Maximum 10 symbols allowed');
      return;
    }

    setSymbols([...symbols, trimmedSymbol]);
    setNewSymbol('');
    setError(null);
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    if (symbols.length <= 1) {
      setError('At least 1 symbol required');
      return;
    }
    setSymbols(symbols.filter(s => s !== symbolToRemove));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (period === '1d') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (['5d', '1mo'].includes(period)) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              <strong>{entry.name}:</strong> {entry.value.toFixed(2)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-comparison">
      <div className="comparison-header">
        <div className="header-content">
          <h1>
            <BarChart3 size={32} />
            Chart Comparison
          </h1>
          <p className="header-subtitle">
            Compare multiple assets with normalized percentage changes
          </p>
        </div>
      </div>

      {/* Symbol Management */}
      <div className="symbol-controls">
        <div className="symbol-chips">
          {symbols.map((symbol, index) => (
            <div
              key={symbol}
              className="symbol-chip"
              style={{ borderColor: COLORS[index % COLORS.length] }}
            >
              <div
                className="chip-indicator"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="chip-symbol">{symbol}</span>
              {symbols.length > 1 && (
                <button
                  className="chip-remove"
                  onClick={() => handleRemoveSymbol(symbol)}
                  title="Remove symbol"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <form className="add-symbol-form" onSubmit={handleAddSymbol}>
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Add symbol (e.g., GOOGL)"
            maxLength={10}
          />
          <button type="submit" disabled={!newSymbol.trim() || symbols.length >= 10}>
            <Plus size={18} />
            Add
          </button>
        </form>
      </div>

      {/* Time Controls */}
      <div className="time-controls">
        <div className="control-group">
          <label>
            <Calendar size={16} />
            Period:
          </label>
          <div className="period-buttons">
            {periods.map((p) => (
              <button
                key={p.value}
                className={`period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => {
                  setPeriod(p.value);
                  // Auto-select valid interval
                  const validIntervals = intervals.filter(int => int.periods.includes(p.value));
                  if (!validIntervals.find(int => int.value === interval)) {
                    setInterval(validIntervals[0].value);
                  }
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Interval:</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            {getValidIntervals().map((int) => (
              <option key={int.value} value={int.value}>
                {int.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {comparisonData && !loading && (
        <div className="summary-cards">
          {comparisonData.data.map((symbolData, index) => (
            <div
              key={symbolData.symbol}
              className="summary-card"
              style={{ borderTopColor: COLORS[index % COLORS.length] }}
            >
              <div className="card-header">
                <div
                  className="card-indicator"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <h3>{symbolData.symbol}</h3>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Current</span>
                  <span className="stat-value">${symbolData.current_price.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Change</span>
                  <span className={`stat-value ${symbolData.total_change_pct >= 0 ? 'positive' : 'negative'}`}>
                    {symbolData.total_change_pct >= 0 ? '+' : ''}
                    {symbolData.total_change_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Dollar Change</span>
                  <span className={`stat-value ${symbolData.total_change >= 0 ? 'positive' : 'negative'}`}>
                    {symbolData.total_change >= 0 ? '+' : ''}
                    ${symbolData.total_change.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="chart-container">
        {loading ? (
          <div className="loading-chart">
            <div className="spinner"></div>
            <p>Loading comparison data...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                label={{ value: '% Change from Start', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {symbols.map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={symbol}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">
            <TrendingUp size={48} />
            <h3>No Data Available</h3>
            <p>Add symbols to start comparing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartComparison;
