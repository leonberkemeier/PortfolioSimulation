import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, TrendingUp, Activity, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import api, { portfolios, orders } from '../services/api';
import '../styles/TradingInterface.css';

export default function TradingInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Portfolio data
  const [portfolio, setPortfolio] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  
  // Form state
  const [orderType, setOrderType] = useState('BUY');
  const [assetType, setAssetType] = useState('stock');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderStyle, setOrderStyle] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  
  // Quote data
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolioData();
  }, [id]);

  useEffect(() => {
    if (symbol && symbol.length >= 1) {
      const timer = setTimeout(() => {
        fetchQuote();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [symbol]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const portfolioResponse = await portfolios.getById(id);
      setPortfolio(portfolioResponse.data);

      const ordersResponse = await portfolios.getTransactions(id);
      setRecentOrders((ordersResponse.data.transactions || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async () => {
    if (!symbol) return;
    
    try {
      setLoadingQuote(true);
      
      // Format symbol for Yahoo Finance based on asset type
      let yahooSymbol = symbol.toUpperCase();
      if (assetType === 'crypto') {
        // Crypto needs -USD suffix for Yahoo Finance
        yahooSymbol = `${symbol.toUpperCase()}-USD`;
      }
      
      // Fetch live quote from backend (Yahoo Finance)
      const response = await api.get(`/orders/quote/${yahooSymbol}`);
      const quoteData = response.data;
      
      setQuote({
        symbol: quoteData.symbol,
        name: quoteData.name,
        price: quoteData.price,
        change: quoteData.change || 0,
        changePercent: quoteData.changePercent || 0,
        open: quoteData.open || quoteData.price,
        high: quoteData.high || quoteData.price,
        low: quoteData.low || quoteData.price,
        volume: quoteData.volume || 0,
        previousClose: quoteData.previousClose || quoteData.price,
        source: quoteData.source || 'unknown',
      });
    } catch (err) {
      console.error('Error fetching quote:', err);
      // If quote not found, clear the quote
      setQuote(null);
      if (err.response?.status === 404) {
        setError(`Symbol ${symbol.toUpperCase()} not found`);
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Submitting order...', { symbol, quantity, orderType, orderStyle });
    
    if (!symbol || !quantity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const orderData = {
        portfolio_id: parseInt(id),
        symbol: symbol.toUpperCase(),
        asset_type: assetType,
        order_type: orderType,
        quantity: parseFloat(quantity),
        order_style: orderStyle,
        limit_price: orderStyle === 'LIMIT' ? parseFloat(limitPrice) : undefined,
      };

      console.log('Order data:', orderData);
      const response = await orders.create(orderData);
      console.log('Order response:', response);
      
      const assetLabel = assetType === 'stock' ? 'shares' : assetType === 'crypto' ? 'coins' : 'units';
      setSuccess(`${orderType} order for ${quantity} ${assetLabel} of ${symbol.toUpperCase()} submitted successfully!`);
      
      // Reset form
      setSymbol('');
      setQuantity('');
      setLimitPrice('');
      setQuote(null);
      
      // Refresh data
      await fetchPortfolioData();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('Error submitting order:', err);
      console.error('Error details:', err.response);
      
      // Handle error message properly - check if backend returned validation errors
      let errorMessage = 'Failed to submit order';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // If detail is an array of validation errors
        if (Array.isArray(detail)) {
          errorMessage = detail
            .map(e => `${e.loc ? e.loc.join('.') : 'field'}: ${e.msg}`)
            .join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateOrderTotal = () => {
    if (!quantity || !quote) return 0;
    const price = orderStyle === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : quote.price;
    return parseFloat(quantity) * price;
  };

  const estimatedFees = () => {
    const total = calculateOrderTotal();
    return total * 0.001; // 0.1% fee
  };

  const orderTotal = calculateOrderTotal();
  const fees = estimatedFees();
  const totalWithFees = orderTotal + fees;

  if (loading) {
    return (
      <div className="trading-interface">
        <div className="loading-detail">
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading trading interface...</p>
        </div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="trading-interface">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="error-detail">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="trading-interface">
        <div className="loading-detail">
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-interface">
      <button className="back-button" onClick={() => navigate(`/portfolio/${id}`)}>
        <ArrowLeft size={20} />
        Back to Portfolio
      </button>

      {/* Header */}
      <div className="trading-header">
        <div className="trading-title">
          <h1>Trade</h1>
          <p>{portfolio?.name}</p>
        </div>
        <div className="portfolio-balance">
          <div className="balance-label">Available Cash</div>
          <div className="balance-value">
            {formatCurrency(parseFloat(portfolio?.current_cash || 0))}
          </div>
        </div>
      </div>

      <div className="trading-grid">
        {/* Order Form */}
        <div className="order-form-section">
          <h2>
            <ShoppingCart size={24} />
            Place Order
          </h2>

          {success && (
            <div className="success-message">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitOrder}>
            {/* Order Type */}
            <div className="order-type-tabs">
              <button
                type="button"
                className={`order-type-tab ${orderType === 'BUY' ? 'active' : ''}`}
                onClick={() => setOrderType('BUY')}
              >
                Buy
              </button>
              <button
                type="button"
                className={`order-type-tab ${orderType === 'SELL' ? 'active' : ''}`}
                onClick={() => setOrderType('SELL')}
              >
                Sell
              </button>
            </div>

            {/* Asset Type */}
            <div className="form-group">
              <label>Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => {
                  setAssetType(e.target.value);
                  setSymbol('');
                  setQuote(null);
                }}
                className="asset-type-select"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="bond">Bond</option>
                <option value="commodity">Commodity</option>
              </select>
            </div>

            {/* Symbol */}
            <div className="form-group">
              <label>
                {assetType === 'stock' && 'Stock Symbol'}
                {assetType === 'crypto' && 'Crypto Symbol'}
                {assetType === 'bond' && 'Bond Symbol'}
                {assetType === 'commodity' && 'Commodity Symbol'}
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder={
                  assetType === 'stock' ? 'e.g., AAPL' :
                  assetType === 'crypto' ? 'e.g., BTC, ETH' :
                  assetType === 'bond' ? 'e.g., US10Y' :
                  'e.g., GC (Gold)'
                }
                required
              />
              {assetType === 'crypto' && (
                <small style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                  Use symbols like BTC, ETH, ADA, SOL
                </small>
              )}
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  assetType === 'stock' ? 'Number of shares' :
                  assetType === 'crypto' ? 'Number of coins' :
                  'Number of units'
                }
                min="0.01"
                step="0.01"
                required
              />
            </div>

            {/* Order Style */}
            <div className="form-group">
              <label>Order Type</label>
              <select value={orderStyle} onChange={(e) => setOrderStyle(e.target.value)}>
                <option value="MARKET">Market Order</option>
                <option value="LIMIT">Limit Order</option>
              </select>
            </div>

            {/* Limit Price */}
            {orderStyle === 'LIMIT' && (
              <div className="form-group">
                <label>Limit Price</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Price per share"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            )}

            {/* Order Summary */}
            {quote && quantity && (
              <div className="order-summary">
                <div className="summary-row">
                  <span className="summary-label">Shares</span>
                  <span className="summary-value">{quantity}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Price per Share</span>
                  <span className="summary-value">
                    {formatCurrency(orderStyle === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : quote.price)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">{formatCurrency(orderTotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Est. Fees</span>
                  <span className="summary-value">{formatCurrency(fees)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total</span>
                  <span className="summary-value">{formatCurrency(totalWithFees)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`submit-order-btn ${orderType.toLowerCase()}`}
              disabled={submitting || !symbol || !quantity}
            >
              {submitting ? 'Submitting...' : `${orderType} ${symbol || 'Stock'}`}
            </button>
          </form>
        </div>

        {/* Market Data */}
        <div className="market-data-section">
          {/* Quote Card */}
          {quote && (
            <div className="quote-card">
              <h2>
                <TrendingUp size={24} />
                Market Quote
                {quote.source === 'yahoo_finance_live' && (
                  <span style={{ 
                    marginLeft: 'auto', 
                    fontSize: '0.875rem', 
                    color: 'var(--accent-green)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Activity size={16} />
                    LIVE
                  </span>
                )}
              </h2>
              
              <div className="quote-header">
                <div>
                  <div className="quote-symbol">{quote.symbol}</div>
                  <div className="quote-name">{quote.name}</div>
                </div>
                <div className="quote-price">
                  <div className="current-price">{formatCurrency(quote.price)}</div>
                  <div className={`price-change ${quote.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change)}
                    ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="quote-stats">
                <div className="quote-stat">
                  <div className="quote-stat-label">Prev Close</div>
                  <div className="quote-stat-value">{formatCurrency(quote.previousClose || quote.price)}</div>
                </div>
                <div className="quote-stat">
                  <div className="quote-stat-label">Open</div>
                  <div className="quote-stat-value">{formatCurrency(quote.open)}</div>
                </div>
                <div className="quote-stat">
                  <div className="quote-stat-label">High</div>
                  <div className="quote-stat-value">{formatCurrency(quote.high)}</div>
                </div>
                <div className="quote-stat">
                  <div className="quote-stat-label">Low</div>
                  <div className="quote-stat-value">{formatCurrency(quote.low)}</div>
                </div>
                <div className="quote-stat">
                  <div className="quote-stat-label">Volume</div>
                  <div className="quote-stat-value">{formatNumber(quote.volume)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="recent-orders">
            <h2>
              <Activity size={24} />
              Recent Orders
            </h2>
            
            {recentOrders.length > 0 ? (
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className={`order-badge ${order.order_type.toLowerCase()}`}>
                      {order.order_type}
                    </div>
                    <div className="order-info">
                      <h4>{order.ticker}</h4>
                      <p>{formatDateTime(order.timestamp)} • {parseFloat(order.quantity).toFixed(2)} shares</p>
                    </div>
                    <div className={`order-status executed`}>
                      Executed
                    </div>
                    <div className="order-amount">
                      {formatCurrency(parseFloat(order.total_cost || 0))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
