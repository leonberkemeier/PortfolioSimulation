import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, DollarSign, Activity, PieChart, BarChart3, ShoppingCart, X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { portfolios } from '../services/api';
import '../styles/PortfolioDetail.css';

export default function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [navHistory, setNavHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const portfolioHeaderRef = useRef(null);

  useEffect(() => {
    fetchPortfolioData();
  }, [id]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId;
    let countdownId;
    
    if (autoRefresh && id) {
      // Set initial next update time
      setNextUpdate(Date.now() + refreshInterval * 1000);
      
      // Refresh data at specified interval
      intervalId = setInterval(() => {
        console.log('🔄 Auto-refreshing portfolio data...');
        fetchPortfolioData();
        setNextUpdate(Date.now() + refreshInterval * 1000);
      }, refreshInterval * 1000);
      
      // Update countdown every second
      countdownId = setInterval(() => {
        setNextUpdate(prev => prev ? prev - 1000 : 0);
      }, 1000);
    } else {
      setNextUpdate(null);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [autoRefresh, refreshInterval, id]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolio details
      const portfolioResponse = await portfolios.getById(id);
      console.log('Portfolio:', portfolioResponse.data);
      setPortfolio(portfolioResponse.data);

      // Fetch holdings
      const holdingsResponse = await portfolios.getHoldings(id);
      console.log('Holdings:', holdingsResponse.data);
      setHoldings(Array.isArray(holdingsResponse.data) ? holdingsResponse.data : (holdingsResponse.data.holdings || []));

      // Fetch transactions
      const transactionsResponse = await portfolios.getTransactions(id);
      console.log('Transactions:', transactionsResponse.data);
      setTransactions(transactionsResponse.data.transactions || []);

      // Fetch NAV history
      const navResponse = await portfolios.getNavHistory(id);
      console.log('NAV History:', navResponse.data);
      setNavHistory(navResponse.data.history || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(`Failed to load portfolio: ${err.message}`);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
      
      // Trigger pulse animation
      if (portfolioHeaderRef.current && autoRefresh) {
        portfolioHeaderRef.current.classList.add('updating');
        setTimeout(() => {
          if (portfolioHeaderRef.current) {
            portfolioHeaderRef.current.classList.remove('updating');
          }
        }, 500);
      }
    }
  };

  const handleDeletePortfolio = async () => {
    try {
      setDeleting(true);
      await portfolios.delete(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      setError(`Failed to delete portfolio: ${err.message}`);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getTimeUntilUpdate = () => {
    if (!nextUpdate) return 0;
    const seconds = Math.max(0, Math.floor((nextUpdate - Date.now()) / 1000));
    return seconds;
  };

  if (loading && !portfolio) {
    return (
      <div className="loading-detail">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-detail">
        <div className="error-detail">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="portfolio-detail">
        <div className="empty-state">
          <h3>Portfolio not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const allocationData = holdings.map((holding) => ({
    name: holding.ticker,
    value: parseFloat(holding.current_value || 0),
  }));

  // Add cash to allocation
  if (portfolio.current_cash > 0) {
    allocationData.push({
      name: 'Cash',
      value: parseFloat(portfolio.current_cash || 0),
    });
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  const navChartData = navHistory.map((item) => ({
    date: formatDate(item.date),
    nav: parseFloat(item.nav),
  }));

  const totalReturn = parseFloat(portfolio.nav || 0) - parseFloat(portfolio.initial_capital || 0);
  const totalReturnPct = portfolio.total_return_pct || 0;

  return (
    <div className="portfolio-detail">
      <div className="header-actions">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <button className="delete-button" onClick={() => setShowDeleteConfirm(true)} title="Delete Portfolio">
          <X size={20} />
        </button>
      </div>

      {/* Header */}
      <div className="portfolio-detail-header" ref={portfolioHeaderRef}>
        <div className="portfolio-detail-title">
          <div>
            <h1>{portfolio.name}</h1>
            <p>{portfolio.description || 'No description'}</p>
          </div>
          <div className="portfolio-badges">
            <div className={`badge ${portfolio.model_name ? 'model' : 'manual'}`}>
              {portfolio.model_name || 'Manual'}
            </div>
            <div className="badge active">Active</div>
          </div>
        </div>

        {/* Auto-Refresh Controls */}
        <div className="auto-refresh-controls">
          <div className="refresh-toggle">
            <button
              className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity size={16} className={autoRefresh ? 'spinning' : ''} />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            {autoRefresh && (
              <span className="refresh-status">
                Updates in {getTimeUntilUpdate()}s
              </span>
            )}
            {lastUpdated && (
              <span className="last-update">
                Updated: {formatTime(lastUpdated)}
              </span>
            )}
          </div>
          <div className="refresh-interval-selector">
            <label>Interval:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="portfolio-metrics">
          {/* Total Portfolio Value - Most Prominent */}
          <div className="metric-item highlight">
            <div className="metric-label">Total Value</div>
            <div className="metric-value large">{formatCurrency(parseFloat(portfolio.nav || 0))}</div>
          </div>
          
          {/* Asset Breakdown */}
          <div className="metric-item">
            <div className="metric-label">Holdings</div>
            <div className="metric-value">
              {formatCurrency(holdings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0))}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Cash</div>
            <div className="metric-value">{formatCurrency(parseFloat(portfolio.current_cash || 0))}</div>
          </div>
          
          {/* Performance Metrics */}
          <div className="metric-item">
            <div className="metric-label">Return</div>
            <div className={`metric-value ${totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Return %</div>
            <div className={`metric-value ${totalReturnPct >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalReturnPct >= 0 ? '+' : ''}{formatPercent(totalReturnPct)}
            </div>
          </div>
        </div>
      </div>

      {/* NAV Chart */}
      <div className="content-section full-width">
        <h2>
          <TrendingUp size={24} />
          Portfolio Performance
        </h2>
        {navChartData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={navChartData}>
                <defs>
                  <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="nav"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNav)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            <p>No performance data available</p>
          </div>
        )}
      </div>

      <div className="content-grid">
        {/* Holdings Table */}
        <div className="content-section full-width">
          <h2>
            <BarChart3 size={24} />
            Current Holdings
          </h2>
          {holdings.length > 0 ? (
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Shares</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Current Value</th>
                  <th>P/E Ratio</th>
                  <th>Yield %</th>
                  <th>Annual Income</th>
                  <th>Return</th>
                  <th>Return %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const returnPct = ((parseFloat(holding.current_price || 0) - parseFloat(holding.entry_price || 0)) / parseFloat(holding.entry_price || 1)) * 100;
                  const returnValue = (parseFloat(holding.current_price || 0) - parseFloat(holding.entry_price || 0)) * parseFloat(holding.quantity || 0);
                  const dividendYield = parseFloat(holding.dividend_yield || 0);
                  const annualIncome = parseFloat(holding.annual_income || 0);
                  const peRatio = parseFloat(holding.pe_ratio || 0);
                  
                  return (
                    <tr key={holding.ticker}>
                      <td className="symbol-cell">
                        <button 
                          className="symbol-link"
                          onClick={() => navigate(`/market?symbol=${holding.ticker}&type=${holding.asset_type || 'stock'}`)}
                          title={`View ${holding.ticker} in Market View`}
                        >
                          {holding.ticker}
                        </button>
                      </td>
                      <td>{parseFloat(holding.quantity || 0).toFixed(2)}</td>
                      <td>{formatCurrency(parseFloat(holding.entry_price || 0))}</td>
                      <td>{formatCurrency(parseFloat(holding.current_price || 0))}</td>
                      <td>{formatCurrency(parseFloat(holding.current_value || 0))}</td>
                      <td>
                        {peRatio > 0 ? peRatio.toFixed(2) : '-'}
                      </td>
                      <td className={dividendYield > 0 ? 'text-success' : ''}>
                        {dividendYield > 0 ? `${dividendYield.toFixed(2)}%` : '-'}
                      </td>
                      <td className={annualIncome > 0 ? 'text-success' : ''}>
                        {annualIncome > 0 ? formatCurrency(annualIncome) : '-'}
                      </td>
                      <td className={returnValue >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(returnValue)}
                      </td>
                      <td className={returnPct >= 0 ? 'text-success' : 'text-danger'}>
                        {formatPercent(returnPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No Holdings</h3>
              <p>This portfolio doesn't have any positions yet</p>
            </div>
          )}
        </div>

        {/* Allocation Pie Chart */}
        <div className="content-section">
          <h2>
            <PieChart size={24} />
            Asset Allocation
          </h2>
          {allocationData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p>No allocation data</p>
            </div>
          )}
        </div>

        {/* Transactions History */}
        <div className="content-section">
          <h2>
            <Activity size={24} />
            Recent Transactions
          </h2>
          {transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className={`transaction-icon ${transaction.order_type.toLowerCase()}`}>
                    <ShoppingCart size={24} color={transaction.order_type === 'buy' ? '#10b981' : '#ef4444'} />
                  </div>
                  <div className="transaction-details">
                    <h4>{transaction.order_type.toUpperCase()} {transaction.ticker}</h4>
                    <p>{formatDateTime(transaction.timestamp)}</p>
                  </div>
                  <div className="transaction-amount">
                    <div className={`amount ${transaction.order_type === 'buy' ? 'text-danger' : 'text-success'}`}>
                      {transaction.order_type === 'buy' ? '-' : '+'}{formatCurrency(parseFloat(transaction.total_cost || 0))}
                    </div>
                    <div className="shares">
                      {parseFloat(transaction.quantity || 0).toFixed(2)} shares @ {formatCurrency(parseFloat(transaction.price || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No Transactions</h3>
              <p>No trading activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => navigate(`/trade/${id}`)}>
          <ShoppingCart size={20} />
          Trade
        </button>
        <button className="btn btn-secondary" onClick={() => navigate(`/analytics/${id}`)}>
          <BarChart3 size={20} />
          View Analytics
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Portfolio</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{portfolio.name}</strong>?</p>
              <p style={{ color: 'var(--accent-red)', marginTop: '1rem' }}>
                This action cannot be undone. All holdings, transactions, and history will be permanently deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeletePortfolio}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
