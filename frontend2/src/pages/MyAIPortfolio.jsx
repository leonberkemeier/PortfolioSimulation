import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Shield, TrendingUp, AlertTriangle, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../services/api';
import '../styles/MyAIPortfolio.css';

// ── Profile meta — mirrors RiskAssessment.jsx ────────────────────────────────
const PROFILES = {
  1: { name: 'Conservative',           color: '#3b82f6', icon: Shield,        maxVaR: '2%'  },
  2: { name: 'Moderately Conservative',color: '#8b5cf6', icon: Shield,        maxVaR: '4%'  },
  3: { name: 'Moderate',               color: '#f59e0b', icon: TrendingUp,    maxVaR: '6%'  },
  4: { name: 'Moderately Aggressive',  color: '#ef4444', icon: TrendingUp,    maxVaR: '10%' },
  5: { name: 'Aggressive',             color: '#f97316', icon: AlertTriangle, maxVaR: '15%' },
};

export default function MyAIPortfolio() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [state, setState]         = useState('loading'); // 'loading'|'ok'|'no_profile'|'no_portfolio'|'error'

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portfolio/my-ai-portfolio');
      setPortfolio(res.data);
      setState('ok');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'no_profile')    setState('no_profile');
      else if (detail === 'no_portfolio') setState('no_portfolio');
      else setState('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="aip-container">
        <div className="aip-card aip-center">
          <div className="aip-spinner" />
          <p className="aip-muted">Loading your AI portfolio…</p>
        </div>
      </div>
    );
  }

  // ── No risk profile set ───────────────────────────────────────────────────
  if (state === 'no_profile') {
    return (
      <div className="aip-container">
        <div className="aip-card aip-center">
          <Shield size={48} className="aip-empty-icon" />
          <h2>No Risk Profile Found</h2>
          <p className="aip-muted">
            Complete the Risk Assessment so the AI can assign you a personalised portfolio.
          </p>
          <Link to="/risk-profile" className="aip-btn-primary">
            Take the Assessment
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Portfolio not built yet ────────────────────────────────────────────────
  if (state === 'no_portfolio') {
    return (
      <div className="aip-container">
        <div className="aip-card aip-center">
          <Bot size={48} className="aip-empty-icon" />
          <h2>Portfolio Not Yet Built</h2>
          <p className="aip-muted">
            The AI PC runs its pipeline every morning. Your personalised portfolio
            will appear here after the next scheduled run.
          </p>
          <button className="aip-btn-ghost" onClick={fetchPortfolio}>
            <RefreshCw size={15} />
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="aip-container">
        <div className="aip-card aip-center">
          <p className="aip-error">Failed to load portfolio. Please try again.</p>
          <button className="aip-btn-ghost" onClick={fetchPortfolio}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Portfolio loaded ───────────────────────────────────────────────────────
  const profile     = PROFILES[portfolio.profile_id] || PROFILES[3];
  const ProfileIcon = profile.icon;
  const updatedDate = new Date(portfolio.execution_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="aip-container">
      {/* Header card */}
      <div className="aip-card aip-header-card" style={{ borderTopColor: profile.color }}>
        <div className="aip-header-left">
          <div className="aip-profile-icon" style={{ color: profile.color }}>
            <ProfileIcon size={32} />
          </div>
          <div>
            <p className="aip-label">Your AI-Managed Portfolio</p>
            <h1 className="aip-profile-name" style={{ color: profile.color }}>
              {portfolio.profile_name}
            </h1>
          </div>
        </div>
        <div className="aip-header-right">
          <div className="aip-stat">
            <span className="aip-stat-label">Max VaR</span>
            <span className="aip-stat-value" style={{ color: profile.color }}>{profile.maxVaR}</span>
          </div>
          <div className="aip-stat">
            <span className="aip-stat-label">Positions</span>
            <span className="aip-stat-value" style={{ color: profile.color }}>
              {portfolio.positions.filter(p => p.ticker !== 'CASH').length}
            </span>
          </div>
          <div className="aip-stat">
            <span className="aip-stat-label">Last Built</span>
            <span className="aip-stat-value aip-date">
              <Clock size={13} />
              {updatedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Positions table */}
      <div className="aip-card">
        <div className="aip-table-header">
          <h2>Holdings</h2>
          <button className="aip-btn-ghost" onClick={fetchPortfolio}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <table className="aip-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ticker</th>
              <th className="aip-right">Target Weight</th>
              <th className="aip-right">Allocation Bar</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions
              .filter(p => p.ticker !== 'CASH')
              .sort((a, b) => b.weight - a.weight)
              .map((pos, i) => (
                <tr key={pos.ticker}>
                  <td className="aip-muted">{i + 1}</td>
                  <td className="aip-ticker">{pos.ticker}</td>
                  <td className="aip-right">{(pos.weight * 100).toFixed(2)}%</td>
                  <td className="aip-right">
                    <div className="aip-bar-bg">
                      <div
                        className="aip-bar-fill"
                        style={{
                          width: `${Math.min(100, pos.weight * 100 * 3)}%`,
                          background: profile.color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}

            {/* CASH row if present */}
            {portfolio.positions.some(p => p.ticker === 'CASH') && (
              <tr className="aip-cash-row">
                <td className="aip-muted">—</td>
                <td className="aip-ticker">CASH</td>
                <td className="aip-right">
                  {(
                    portfolio.positions.find(p => p.ticker === 'CASH')?.weight * 100
                  ).toFixed(2)}%
                </td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="aip-footer-note">
        This portfolio is built daily by the AI PC using Hidden Markov Model regime detection,
        GARCH Monte Carlo risk simulation, and LLM conviction scoring.
        Positions are equal-weighted within your VaR envelope.
        &nbsp;
        <Link to="/risk-profile" className="aip-link">Change your risk profile →</Link>
      </p>
    </div>
  );
}
