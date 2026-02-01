import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Activity, BarChart3, Calendar, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import api from '../services/api';
import '../styles/MarketView.css';

// Custom Candlestick Shape Component
const CandlestickShape = (props) => {
  const { x, y, width, height, payload, value } = props;
  
  if (!payload || payload.open === undefined || payload.high === undefined || 
      payload.low === undefined || payload.price === undefined) {
    return null;
  }

  const isGreen = payload.price >= payload.open;
  const color = isGreen ? '#10b981' : '#ef4444';
  
  // The 'value' prop contains [low, high] range
  // We need to calculate positions based on the bar's coordinate system
  // The bar represents the range from low to high
  
  // Get data range
  const dataHigh = payload.high;
  const dataLow = payload.low;
  const dataOpen = payload.open;
  const dataClose = payload.price;
  const dataRange = dataHigh - dataLow;
  
  if (dataRange === 0) {
    // No price movement, draw a simple line
    const wickX = x + width / 2;
    return (
      <line
        x1={wickX - 3}
        y1={y}
        x2={wickX + 3}
        y2={y}
        stroke={color}
        strokeWidth={2}
      />
    );
  }
  
  // Calculate Y positions as proportions within the bar height
  // y is at the top (high), y + height is at the bottom (low)
  const highY = y;
  const lowY = y + height;
  const openRatio = (dataHigh - dataOpen) / dataRange;
  const closeRatio = (dataHigh - dataClose) / dataRange;
  const openY = y + (height * openRatio);
  const closeY = y + (height * closeRatio);
  
  // Body dimensions
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const candleWidth = Math.max(width * 0.6, 2);
  const wickX = x + width / 2;
  
  return (
    <g>
      {/* High-Low Wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Open-Close Body */}
      <rect
        x={x + (width - candleWidth) / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
        opacity={isGreen ? 0.8 : 1}
      />
    </g>
  );
};

const MarketView = () => {
  const [searchParams] = useSearchParams();
  const urlSymbol = searchParams.get('symbol');
  const urlType = searchParams.get('type');
  
  const [symbol, setSymbol] = useState(urlSymbol || 'AAPL');
  const [searchInput, setSearchInput] = useState(urlSymbol || 'AAPL');
  const [assetType, setAssetType] = useState(urlType || 'stock');
  const [quote, setQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [timeRange, setTimeRange] = useState('1d');
  const [chartType, setChartType] = useState('area'); // 'area' or 'candlestick'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load symbol and asset type from URL parameters
  useEffect(() => {
    if (urlSymbol) {
      setSymbol(urlSymbol.toUpperCase());
      setSearchInput(urlSymbol.toUpperCase());
    }
    if (urlType) {
      setAssetType(urlType.toLowerCase());
    }
  }, [urlSymbol, urlType]);

  const timeRanges = [
    { value: '1d', label: 'Day', period: '1d', interval: '5m' },
    { value: '5d', label: 'Week', period: '5d', interval: '15m' },
    { value: '1mo', label: 'Month', period: '1mo', interval: '1h' },
    { value: '3mo', label: '3 Months', period: '3mo', interval: '1d' },
    { value: '1y', label: 'Year', period: '1y', interval: '1d' },
    { value: 'max', label: 'All', period: 'max', interval: '1wk' },
  ];

  useEffect(() => {
    if (symbol) {
      fetchQuoteAndChart();
    }
  }, [symbol, timeRange]);

  const formatSymbolForYahoo = (sym, type) => {
    let yahooSymbol = sym.toUpperCase();
    if (type === 'crypto') {
      yahooSymbol = `${sym.toUpperCase()}-USD`;
    } else if (type === 'bond') {
      const bondMapping = {
        'US10Y': '^TNX',
        'US30Y': '^TYX',
        'US5Y': '^FVX',
        'US2Y': '^IRX',
      };
      yahooSymbol = bondMapping[sym.toUpperCase()] || sym.toUpperCase();
    } else if (type === 'commodity') {
      const commodityMapping = {
        'GC': 'GLD',
        'SI': 'SLV',
        'CL': 'USO',
        'NG': 'UNG',
      };
      yahooSymbol = commodityMapping[sym.toUpperCase()] || sym.toUpperCase();
    }
    return yahooSymbol;
  };

  const fetchQuoteAndChart = async () => {
    setLoading(true);
    setError(null);

    try {
      const yahooSymbol = formatSymbolForYahoo(symbol, assetType);

      // Fetch current quote
      const quoteResponse = await api.get(`/orders/quote/${yahooSymbol}`);
      setQuote(quoteResponse.data);

      // Fetch historical data from Yahoo Finance via yfinance
      const range = timeRanges.find(r => r.value === timeRange);
      const historyResponse = await api.get(`/orders/history/${yahooSymbol}`, {
        params: {
          period: range.period,
          interval: range.interval
        }
      });

      if (historyResponse.data && historyResponse.data.prices) {
        const prices = historyResponse.data.prices;
        setChartData(prices.map(p => ({
          time: p.date || p.time,
          price: p.close,
          high: p.high,
          low: p.low,
          open: p.open,
        })));

        setVolumeData(prices.map(p => ({
          time: p.date || p.time,
          volume: p.volume,
        })));
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.response?.data?.detail || 'Failed to load market data');
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (timeRange === '1d') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isPositive = quote && quote.changePercent >= 0;

  return (
    <div className="market-view">
      {/* Header with Search */}
      <div className="market-header">
        <div className="search-section">
          <form onSubmit={handleSearch} className="market-search">
            <Search size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Search symbol (e.g., AAPL, BTC, TLT)"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
          
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="asset-type-select"
          >
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
            <option value="bond">Bond</option>
            <option value="commodity">Commodity</option>
          </select>
        </div>

        {quote && (
          <div className="quote-header">
            <div className="quote-symbol-section">
              <h1 className="quote-symbol">{quote.symbol}</h1>
              <span className="quote-name">{quote.name}</span>
            </div>
            <div className="quote-price-section">
              <div className="current-price">{formatCurrency(quote.price)}</div>
              <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span>{isPositive ? '+' : ''}{formatCurrency(quote.change)}</span>
                <span>({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            className={`range-btn ${timeRange === range.value ? 'active' : ''}`}
            onClick={() => setTimeRange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      {loading ? (
        <div className="loading-chart">
          <div className="spinner"></div>
          <p>Loading market data...</p>
        </div>
      ) : error ? (
        <div className="error-chart">
          <Activity size={48} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
        </div>
      ) : chartData.length > 0 ? (
        <div className="charts-container">
          {/* Price Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h3>
                <BarChart3 size={20} />
                Price Chart
              </h3>
              <div className="chart-controls">
                <span className="chart-subtitle">
                  {timeRanges.find(r => r.value === timeRange)?.label} View
                </span>
                <div className="chart-type-toggle">
                  <button
                    className={`toggle-btn ${chartType === 'area' ? 'active' : ''}`}
                    onClick={() => setChartType('area')}
                    title="Area Chart"
                  >
                    <LineChartIcon size={16} />
                  </button>
                  <button
                    className={`toggle-btn ${chartType === 'candlestick' ? 'active' : ''}`}
                    onClick={() => setChartType('candlestick')}
                    title="Candlestick Chart"
                  >
                    <BarChart2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      tickFormatter={formatDate}
                      minTickGap={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                      }}
                      labelFormatter={formatDate}
                      formatter={(value, name) => {
                        if (name === 'price') return [formatCurrency(value), 'Price'];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      tickFormatter={formatDate}
                      minTickGap={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={['dataMin - 5', 'dataMax + 5']}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                      }}
                      labelFormatter={formatDate}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              background: 'rgba(30, 41, 59, 0.95)',
                              border: '1px solid #334155',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                            }}>
                              <p style={{ color: '#cbd5e1', marginBottom: '0.5rem' }}>{formatDate(label)}</p>
                              <p style={{ color: '#10b981' }}>Open: {formatCurrency(data.open)}</p>
                              <p style={{ color: '#3b82f6' }}>High: {formatCurrency(data.high)}</p>
                              <p style={{ color: '#ef4444' }}>Low: {formatCurrency(data.low)}</p>
                              <p style={{ color: '#f59e0b' }}>Close: {formatCurrency(data.price)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={(entry) => [entry.low, entry.high]}
                      shape={(props) => <CandlestickShape {...props} />}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="chart-section volume-chart">
            <div className="chart-header">
              <h3>
                <Activity size={20} />
                Volume
              </h3>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    tickFormatter={formatDate}
                    minTickGap={50}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={formatNumber}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                    }}
                    labelFormatter={formatDate}
                    formatter={(value) => [formatNumber(value), 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Stats */}
          {quote && (
            <div className="market-stats">
              <div className="stat-card">
                <div className="stat-label">Open</div>
                <div className="stat-value">{formatCurrency(quote.open)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">High</div>
                <div className="stat-value">{formatCurrency(quote.high)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Low</div>
                <div className="stat-value">{formatCurrency(quote.low)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Prev Close</div>
                <div className="stat-value">{formatCurrency(quote.previousClose)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Volume</div>
                <div className="stat-value">{formatNumber(quote.volume)}</div>
              </div>
              {quote.peRatio && (
                <div className="stat-card">
                  <div className="stat-label">P/E Ratio</div>
                  <div className="stat-value">{quote.peRatio.toFixed(2)}</div>
                </div>
              )}
              {(quote.dividendYield || quote.dividendRate) && (
                <div className="stat-card">
                  <div className="stat-label">Dividend</div>
                  <div className="stat-value text-success">
                    {quote.dividendYield && `${quote.dividendYield.toFixed(2)}%`}
                    {quote.dividendYield && quote.dividendRate && ' • '}
                    {quote.dividendRate && `${formatCurrency(quote.dividendRate)}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-chart">
          <Search size={64} />
          <h3>Search for a Symbol</h3>
          <p>Enter a stock, crypto, bond, or commodity symbol to view live market data</p>
        </div>
      )}
    </div>
  );
};

export default MarketView;
