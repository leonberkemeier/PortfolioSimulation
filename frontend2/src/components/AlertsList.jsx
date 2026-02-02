import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Check, X, RefreshCw } from 'lucide-react';
import { alerts as alertsApi } from '../services/api';
import '../styles/AlertsList.css';

const AlertsList = ({ symbol = null }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'all', 'active', 'triggered'

  useEffect(() => {
    fetchAlerts();
  }, [symbol, filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const activeOnly = filter === 'active';
      const statusFilter = filter === 'triggered' ? 'triggered' : null;
      
      const response = await alertsApi.list(symbol, statusFilter, activeOnly);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await alertsApi.delete(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleToggle = async (alert) => {
    try {
      if (alert.status === 'active') {
        await alertsApi.disable(alert.id);
        setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'disabled' } : a)));
      } else if (alert.status === 'disabled') {
        await alertsApi.enable(alert.id);
        setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'active' } : a)));
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const getConditionIcon = (condition) => {
    const isAbove = condition.includes('above');
    return isAbove ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const getConditionLabel = (condition) => {
    const labels = {
      above: 'Above',
      below: 'Below',
      crosses_above: 'Crosses Above',
      crosses_below: 'Crosses Below',
    };
    return labels[condition] || condition;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', class: 'status-active', icon: <Bell size={14} /> },
      triggered: { label: 'Triggered', class: 'status-triggered', icon: <Check size={14} /> },
      disabled: { label: 'Disabled', class: 'status-disabled', icon: <BellOff size={14} /> },
      expired: { label: 'Expired', class: 'status-expired', icon: <X size={14} /> },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="alerts-loading">
        <RefreshCw className="spinning" size={24} />
        <p>Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="alerts-list-container">
      <div className="alerts-header">
        <div className="alerts-title">
          <Bell size={20} />
          <h3>Price Alerts {symbol && `for ${symbol}`}</h3>
        </div>
        <div className="alerts-filter">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filter === 'triggered' ? 'active' : ''}`}
            onClick={() => setFilter('triggered')}
          >
            Triggered
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="no-alerts">
          <Bell size={48} />
          <h4>No alerts found</h4>
          <p>Create an alert to get notified when a price target is reached</p>
        </div>
      ) : (
        <div className="alerts-grid">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card ${alert.status}`}>
              <div className="alert-card-header">
                <div className="alert-symbol-condition">
                  <span className="alert-symbol">{alert.symbol}</span>
                  <span className="alert-condition">
                    {getConditionIcon(alert.condition)}
                    {getConditionLabel(alert.condition)}
                  </span>
                </div>
                {getStatusBadge(alert.status)}
              </div>

              <div className="alert-price">
                <div className="price-label">Target Price</div>
                <div className="price-value">${alert.target_price.toFixed(2)}</div>
              </div>

              {alert.last_checked_price && (
                <div className="alert-last-check">
                  <span className="last-check-label">Last checked:</span>
                  <span className="last-check-value">${alert.last_checked_price.toFixed(2)}</span>
                  <span className="last-check-time">{formatDate(alert.last_checked_at)}</span>
                </div>
              )}

              {alert.message && (
                <div className="alert-message">
                  <p>{alert.message}</p>
                </div>
              )}

              <div className="alert-meta">
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">{formatDate(alert.created_at)}</span>
                </div>
                {alert.triggered_at && (
                  <div className="meta-item">
                    <span className="meta-label">Triggered:</span>
                    <span className="meta-value">{formatDate(alert.triggered_at)}</span>
                  </div>
                )}
                {alert.repeat && (
                  <div className="meta-item repeat-badge">
                    <RefreshCw size={12} />
                    <span>Repeating</span>
                  </div>
                )}
              </div>

              <div className="alert-actions">
                {(alert.status === 'active' || alert.status === 'disabled') && (
                  <button
                    className="action-btn toggle-btn"
                    onClick={() => handleToggle(alert)}
                    title={alert.status === 'active' ? 'Disable alert' : 'Enable alert'}
                  >
                    {alert.status === 'active' ? <BellOff size={16} /> : <Bell size={16} />}
                  </button>
                )}
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(alert.id)}
                  title="Delete alert"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsList;
