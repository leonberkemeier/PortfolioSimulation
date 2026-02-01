import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { portfolios } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [portfolioList, setPortfolioList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      console.log('Fetching portfolios from API...');
      const response = await portfolios.list(0, 100);
      console.log('API Response:', response);
      console.log('Portfolios data:', response.data);
      setPortfolioList(response.data.portfolios || []);
      setError(null);
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(`Failed to load portfolios: ${err.message}`);
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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalNav = portfolioList.reduce((sum, p) => sum + parseFloat(p.nav || 0), 0);
  const totalReturn = portfolioList.reduce((sum, p) => sum + (parseFloat(p.nav || 0) - parseFloat(p.initial_capital || 0)), 0);
  const avgReturn = portfolioList.length > 0
    ? portfolioList.reduce((sum, p) => sum + (p.total_return_pct || 0), 0) / portfolioList.length
    : 0;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="hero">
          <h1>Trading Dashboard</h1>
          <p>Monitor and manage your trading portfolios</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Wallet size={24} color="#3b82f6" />
              </div>
            </div>
            <div className="stat-label">Total Portfolios</div>
            <div className="stat-value">{portfolioList.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <BarChart3 size={24} color="#10b981" />
              </div>
            </div>
            <div className="stat-label">Total NAV</div>
            <div className="stat-value">{formatCurrency(totalNav)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: totalReturn >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                <TrendingUp size={24} color={totalReturn >= 0 ? '#10b981' : '#ef4444'} />
              </div>
            </div>
            <div className="stat-label">Total Return</div>
            <div className={`stat-value ${totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(totalReturn)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: avgReturn >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                <Activity size={24} color={avgReturn >= 0 ? '#10b981' : '#ef4444'} />
              </div>
            </div>
            <div className="stat-label">Avg Return</div>
            <div className={`stat-value ${avgReturn >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPercent(avgReturn)}
            </div>
          </div>
        </div>
      </header>

      {/* Portfolios List */}
      <section className="portfolios-section">
        <h2>Your Portfolios</h2>
        
        {portfolioList.length === 0 ? (
          <div className="empty">
            <h3>No Portfolios Yet</h3>
            <p>Create your first portfolio to get started</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-portfolio')}>
              Create Portfolio
            </button>
          </div>
        ) : (
          <div className="portfolios-grid">
            {portfolioList.map((portfolio) => (
              <div
                key={portfolio.id}
                className="portfolio-card"
                onClick={() => navigate(`/portfolio/${portfolio.id}`)}
              >
                <div className="portfolio-header">
                  <div className="portfolio-title">
                    <h3>{portfolio.name}</h3>
                    <p className="text-muted">{portfolio.description || 'No description'}</p>
                  </div>
                  <div className={`portfolio-type ${portfolio.model_name ? 'model' : 'manual'}`}>
                    {portfolio.model_name || 'Manual'}
                  </div>
                </div>

                <div className="portfolio-stats">
                  <div className="portfolio-stat-item">
                    <div className="portfolio-stat-label">NAV</div>
                    <div className="portfolio-stat-value">
                      {formatCurrency(parseFloat(portfolio.nav || 0))}
                    </div>
                  </div>

                  <div className="portfolio-stat-item">
                    <div className="portfolio-stat-label">Return</div>
                    <div className={`portfolio-stat-value ${(portfolio.total_return_pct || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatPercent(portfolio.total_return_pct || 0)}
                    </div>
                  </div>

                  <div className="portfolio-stat-item">
                    <div className="portfolio-stat-label">Cash</div>
                    <div className="portfolio-stat-value">
                      {formatCurrency(parseFloat(portfolio.current_cash || 0))}
                    </div>
                  </div>

                  <div className="portfolio-stat-item">
                    <div className="portfolio-stat-label">Holdings</div>
                    <div className="portfolio-stat-value">
                      {formatCurrency(parseFloat(portfolio.nav || 0) - parseFloat(portfolio.current_cash || 0))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
