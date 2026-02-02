import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// ============ Health Check ============
export const healthCheck = () => api.get('/health');

// ============ Portfolios ============
export const portfolios = {
  list: (skip = 0, limit = 10) =>
    api.get('/portfolios', { params: { skip, limit } }),
  create: (data) => api.post('/portfolios', data),
  getById: (id) => api.get(`/portfolios/${id}`),
  get: (id) => api.get(`/portfolios/${id}`),
  update: (id, data) => api.put(`/portfolios/${id}`, data),
  delete: (id) => api.delete(`/portfolios/${id}`),
  getHoldings: (id) => api.get(`/orders/${id}/holdings`),
  getTransactions: (id, skip = 0, limit = 100) =>
    api.get(`/orders/${id}/history`, { params: { skip, limit } }),
  getNavHistory: (id, skip = 0, limit = 365) =>
    api.get(`/analytics/${id}/snapshots`, { params: { skip, limit } }),
};

// ============ Orders ============
export const orders = {
  create: (data) => {
    // Route to correct endpoint based on order type
    const portfolioId = data.portfolio_id;
    const orderData = {
      ticker: data.symbol,
      asset_type: data.asset_type || 'stock',  // Use provided asset_type or default to stock
      quantity: data.quantity,
    };
    
    if (data.order_type === 'BUY') {
      return api.post(`/orders/${portfolioId}/buy`, orderData);
    } else {
      return api.post(`/orders/${portfolioId}/sell`, orderData);
    }
  },
  buy: (portfolioId, data) =>
    api.post(`/orders/${portfolioId}/buy`, data),
  sell: (portfolioId, data) =>
    api.post(`/orders/${portfolioId}/sell`, data),
  history: (portfolioId, skip = 0, limit = 10) =>
    api.get(`/orders/${portfolioId}/history`, { params: { skip, limit } }),
  holdings: (portfolioId) =>
    api.get(`/orders/${portfolioId}/holdings`),
};

// ============ Analytics ============
export const analytics = {
  performance: (portfolioId) =>
    api.get(`/analytics/${portfolioId}/performance`),
  snapshots: (portfolioId, skip = 0, limit = 30) =>
    api.get(`/analytics/${portfolioId}/snapshots`, { params: { skip, limit } }),
  risk: (portfolioId) =>
    api.get(`/analytics/${portfolioId}/risk`),
  riskAnalysis: (portfolioId) =>
    api.get(`/analytics/${portfolioId}/risk-analysis`),
  allocation: (portfolioId) =>
    api.get(`/analytics/${portfolioId}/allocation`),
  createSnapshot: (portfolioId, date = null) =>
    api.post(`/analytics/${portfolioId}/snapshot`, { snapshot_date: date }),
  calculateMetrics: (portfolioId, date = null) =>
    api.post(`/analytics/${portfolioId}/metrics`, { metric_date: date }),
  compare: (symbols, period = '1mo', interval = '1d') =>
    api.get('/analytics/compare', {
      params: {
        symbols: Array.isArray(symbols) ? symbols.join(',') : symbols,
        period,
        interval
      }
    }),
};

// ============ Price Alerts ============
export const alerts = {
  list: (symbol = null, status = null, activeOnly = false) => {
    const params = {};
    if (symbol) params.symbol = symbol;
    if (status) params.status = status;
    if (activeOnly) params.active_only = true;
    return api.get('/alerts', { params });
  },
  create: (data) => api.post('/alerts', data),
  getById: (id) => api.get(`/alerts/${id}`),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
  disable: (id) => api.post(`/alerts/${id}/disable`),
  enable: (id) => api.post(`/alerts/${id}/enable`),
  check: (symbol = null) => {
    const params = symbol ? { symbol } : {};
    return api.post('/alerts/check', null, { params });
  },
};

export default api;
