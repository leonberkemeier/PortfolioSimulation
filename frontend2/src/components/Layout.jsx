import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Layers, Plus, TrendingUp, Zap, LineChart } from 'lucide-react';
import '../styles/Layout.css';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/models', icon: Layers, label: 'Models' },
    { path: '/create-portfolio', icon: Plus, label: 'New Portfolio' },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <LineChart color="white" size={28} />
            </div>
            <div className="logo-text">
              <h1>TradeSim</h1>
              <p className="logo-subtitle">Professional Trading Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="nav-section-title">Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="footer-title">
              <TrendingUp size={16} />
              <span>Trading Simulator</span>
            </div>
            <p className="footer-text">
              Version 1.0 • Professional Platform
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
