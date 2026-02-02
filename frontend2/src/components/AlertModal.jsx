import React, { useState } from 'react';
import { Bell, X, TrendingUp, TrendingDown } from 'lucide-react';
import '../styles/AlertModal.css';

const AlertModal = ({ isOpen, onClose, symbol, currentPrice, onCreateAlert }) => {
  const [formData, setFormData] = useState({
    condition: 'above',
    target_price: currentPrice || '',
    message: '',
    repeat: false,
    notify_browser: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const alertData = {
        symbol: symbol.toUpperCase(),
        condition: formData.condition,
        target_price: parseFloat(formData.target_price),
        message: formData.message || null,
        repeat: formData.repeat,
        notify_browser: formData.notify_browser,
      };

      await onCreateAlert(alertData);
      
      // Reset form
      setFormData({
        condition: 'above',
        target_price: currentPrice || '',
        message: '',
        repeat: false,
        notify_browser: true,
      });
      
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions = [
    { value: 'above', label: 'Price Above', icon: TrendingUp, description: 'Alert when price is above target' },
    { value: 'below', label: 'Price Below', icon: TrendingDown, description: 'Alert when price is below target' },
    { value: 'crosses_above', label: 'Crosses Above', icon: TrendingUp, description: 'Alert when price crosses above target' },
    { value: 'crosses_below', label: 'Crosses Below', icon: TrendingDown, description: 'Alert when price crosses below target' },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Bell size={24} />
            <div>
              <h2>Create Price Alert</h2>
              <p className="modal-subtitle">
                {symbol} • Current: ${currentPrice?.toFixed(2) || '---'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="alert-form">
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Alert Condition</label>
            <div className="condition-grid">
              {conditionOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`condition-btn ${formData.condition === option.value ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, condition: option.value })}
                  >
                    <Icon size={20} />
                    <div className="condition-content">
                      <div className="condition-label">{option.label}</div>
                      <div className="condition-desc">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="target_price">
              Target Price
              <span className="required">*</span>
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="target_price"
                step="0.01"
                min="0"
                value={formData.target_price}
                onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                placeholder="Enter target price"
                required
              />
            </div>
            {currentPrice && formData.target_price && (
              <div className="price-diff">
                {((formData.target_price - currentPrice) / currentPrice * 100).toFixed(2)}% 
                {' '}{formData.target_price > currentPrice ? 'above' : 'below'} current price
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="message">Custom Message (Optional)</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="e.g., Time to consider selling..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.repeat}
                onChange={(e) => setFormData({ ...formData, repeat: e.target.checked })}
              />
              <span>
                Repeat alert
                <small>Keep alert active after it triggers</small>
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertModal;
