import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  get: (id) => api.get(`/portfolios/${id}`),
  update: (id, data) => api.put(`/portfolios/${id}`, data),
  delete: (id) => api.delete(`/portfolios/${id}`),
};

// ============ Orders ============
export const orders = {
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
  allocation: (portfolioId) =>
    api.get(`/analytics/${portfolioId}/allocation`),
  createSnapshot: (portfolioId, date = null) =>
    api.post(`/analytics/${portfolioId}/snapshot`, { snapshot_date: date }),
  calculateMetrics: (portfolioId, date = null) =>
    api.post(`/analytics/${portfolioId}/metrics`, { metric_date: date }),
};

// ============ Model Analytics ============
export const models = {
  list: () => api.get('/models'),
  analytics: (modelName, recentLimit = 10) =>
    api.get(`/models/${modelName}/analytics`, { params: { recent_limit: recentLimit } }),
  comparison: () => api.get('/models/comparison'),
  signals: (modelName, skip = 0, limit = 50) =>
    api.get(`/models/${modelName}/signals`, { params: { skip, limit } }),
  trades: (modelName, limit = 50) =>
    api.get(`/models/${modelName}/trades`, { params: { limit } }),
};

// ============ Stock Screener ============
export const screener = {
  stats: (params = {}) => api.get('/screener/stats', { params }),
  dividend: (params = {}) => api.get('/screener/dividend', { params }),
  volatility: (params = {}) => api.get('/screener/volatility', { params }),
  tickers: (limit = 500) => api.get('/screener/tickers', { params: { limit } }),
  health: () => api.get('/screener/health'),
};

export default api;
