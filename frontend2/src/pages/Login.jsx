import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, TrendingUp } from 'lucide-react';
import '../styles/Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Logo/Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <TrendingUp />
          </div>
          <h1 className="login-title">Trading Simulator</h1>
          <p className="login-subtitle">Portfolio Management & Analytics</p>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <h2 className="login-header">
            <LogIn />
            Sign In
          </h2>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <div className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Contact your administrator for access</p>
          </div>
        </div>

        {/* Footer */}
        <div className="app-footer">
          <p>Model-driven and manual paper trading platform</p>
        </div>
      </div>
    </div>
  );
}
