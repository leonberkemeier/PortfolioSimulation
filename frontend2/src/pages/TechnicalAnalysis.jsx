import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, BarChart2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../services/api';
import '../styles/TechnicalAnalysis.css';

export default function TechnicalAnalysis() {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || 'AAPL';
  
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchInput, setSearchInput] = useState(initialSymbol);
  const [period, setPeriod] = useState('3mo');
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      fetchIndicators();
    }
  }, [symbol, period]);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/indicators/${symbol}`, {
        params: { period, interval: '1d' }
      });
      setIndicators(response.data);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError(err.response?.data?.detail || 'Failed to load indicators');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
    }
  };

  const getSignalColor = (signal) => {
    if (!signal) return 'neutral';
    const signalLower = signal.toLowerCase();
    if (signalLower.includes('buy') || signalLower.includes('bullish') || signalLower.includes('oversold')) {
      return 'success';
    } else if (signalLower.includes('sell') || signalLower.includes('bearish') || signalLower.includes('overbought')) {
      return 'danger';
    }
    return 'neutral';
  };

  const getSignalIcon = (signal) => {
    const color = getSignalColor(signal);
    if (color === 'success') return <CheckCircle size={20} className="text-success" />;
    if (color === 'danger') return <XCircle size={20} className="text-danger" />;
    return <AlertTriangle size={20} className="text-warning" />;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!indicators?.chart_data) return [];
    
    const { timestamps, prices, sma_20, sma_50, sma_200 } = indicators.chart_data;
    return timestamps.map((time, idx) => ({
      time: new Date(time).toLocaleDateString(),
      price: prices[idx],
      sma20: sma_20?.[idx],
      sma50: sma_50?.[idx],
      sma200: sma_200?.[idx]
    }));
  };

  const prepareRSIData = () => {
    if (!indicators?.chart_data) return [];
    
    const { timestamps, rsi } = indicators.chart_data;
    return timestamps.map((time, idx) => ({
      time: new Date(time).toLocaleDateString(),
      rsi: rsi?.[idx]
    }));
  };

  const prepareMACDData = () => {
    if (!indicators?.chart_data) return [];
    
    const { timestamps, macd, macd_signal } = indicators.chart_data;
    return timestamps.map((time, idx) => ({
      time: new Date(time).toLocaleDateString(),
      macd: macd?.[idx],
      signal: macd_signal?.[idx],
      histogram: macd?.[idx] && macd_signal?.[idx] ? macd[idx] - macd_signal[idx] : null
    }));
  };

  const prepareBollingerData = () => {
    if (!indicators?.chart_data) return [];
    
    const { timestamps, prices, bb_upper, bb_middle, bb_lower } = indicators.chart_data;
    return timestamps.map((time, idx) => ({
      time: new Date(time).toLocaleDateString(),
      price: prices[idx],
      upper: bb_upper?.[idx],
      middle: bb_middle?.[idx],
      lower: bb_lower?.[idx]
    }));
  };

  return (
    <div className="technical-analysis">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Activity size={32} />
            Technical Analysis
          </h1>
          <p>Advanced charting with indicators and signals</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter symbol (e.g., AAPL, TSLA, BTC-USD)"
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Analyze</button>
        </form>

        <div className="period-selector">
          {['1mo', '3mo', '6mo', '1y', '2y'].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating indicators...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <XCircle size={48} />
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {indicators && !loading && (
        <>
          {/* Summary Cards */}
          <div className="indicators-grid">
            {/* RSI Card */}
            <div className="indicator-card">
              <div className="indicator-header">
                <h3>RSI (14)</h3>
                {getSignalIcon(indicators.indicators.rsi.signal)}
              </div>
              <div className="indicator-value">
                {indicators.indicators.rsi.value?.toFixed(2) || 'N/A'}
              </div>
              <div className={`indicator-signal signal-${getSignalColor(indicators.indicators.rsi.signal)}`}>
                {indicators.indicators.rsi.signal}
              </div>
              <div className="indicator-description">
                Relative Strength Index • Momentum
              </div>
            </div>

            {/* MACD Card */}
            <div className="indicator-card">
              <div className="indicator-header">
                <h3>MACD</h3>
                {getSignalIcon(indicators.indicators.macd.trend)}
              </div>
              <div className="indicator-value">
                {indicators.indicators.macd.macd?.toFixed(2) || 'N/A'}
              </div>
              <div className={`indicator-signal signal-${getSignalColor(indicators.indicators.macd.trend)}`}>
                {indicators.indicators.macd.trend}
              </div>
              <div className="indicator-description">
                Moving Average Convergence Divergence
              </div>
            </div>

            {/* Moving Averages Card */}
            <div className="indicator-card">
              <div className="indicator-header">
                <h3>Moving Averages</h3>
                {getSignalIcon(indicators.signals.ma_crossover)}
              </div>
              <div className="ma-values">
                <div><span>SMA 50:</span> {indicators.indicators.moving_averages.sma_50?.toFixed(2) || 'N/A'}</div>
                <div><span>SMA 200:</span> {indicators.indicators.moving_averages.sma_200?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className={`indicator-signal signal-${getSignalColor(indicators.signals.ma_crossover)}`}>
                {indicators.signals.ma_crossover}
              </div>
            </div>

            {/* Bollinger Bands Card */}
            <div className="indicator-card">
              <div className="indicator-header">
                <h3>Bollinger Bands</h3>
                {getSignalIcon(indicators.signals.bollinger)}
              </div>
              <div className="bb-values">
                <div><span>Upper:</span> {indicators.indicators.bollinger_bands.upper?.toFixed(2) || 'N/A'}</div>
                <div><span>Middle:</span> {indicators.indicators.bollinger_bands.middle?.toFixed(2) || 'N/A'}</div>
                <div><span>Lower:</span> {indicators.indicators.bollinger_bands.lower?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className={`indicator-signal signal-${getSignalColor(indicators.signals.bollinger)}`}>
                {indicators.signals.bollinger}
              </div>
            </div>
          </div>

          {/* Price with Moving Averages Chart */}
          <div className="chart-section">
            <h2>
              <TrendingUp size={24} />
              Price & Moving Averages
            </h2>
            <div className="chart-container" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" connectNulls />
                  <Line type="monotone" dataKey="sma20" stroke="#10b981" strokeWidth={2} dot={false} name="SMA 20" connectNulls />
                  <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={2} dot={false} name="SMA 50" connectNulls />
                  <Line type="monotone" dataKey="sma200" stroke="#ef4444" strokeWidth={2} dot={false} name="SMA 200" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RSI Chart */}
          <div className="chart-section">
            <h2>
              <BarChart2 size={24} />
              RSI (Relative Strength Index)
            </h2>
            <div className="chart-container" style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prepareRSIData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
                  <Area type="monotone" dataKey="rsi" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MACD Chart */}
          <div className="chart-section">
            <h2>
              <BarChart2 size={24} />
              MACD (Moving Average Convergence Divergence)
            </h2>
            <div className="chart-container" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={prepareMACDData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="histogram" fill="#64748b" opacity={0.5} name="Histogram" />
                  <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="signal" stroke="#ef4444" strokeWidth={2} dot={false} name="Signal" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bollinger Bands Chart */}
          <div className="chart-section">
            <h2>
              <TrendingUp size={24} />
              Bollinger Bands
            </h2>
            <div className="chart-container" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareBollingerData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="upper" stroke="#ef4444" strokeWidth={1} dot={false} name="Upper Band" strokeDasharray="3 3" connectNulls />
                  <Line type="monotone" dataKey="middle" stroke="#f59e0b" strokeWidth={2} dot={false} name="Middle (SMA 20)" connectNulls />
                  <Line type="monotone" dataKey="lower" stroke="#10b981" strokeWidth={1} dot={false} name="Lower Band" strokeDasharray="3 3" connectNulls />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
