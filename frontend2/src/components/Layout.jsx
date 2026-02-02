import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Layers, Plus, TrendingUp, Zap, LineChart, Book, Activity, BarChart2, Menu, X } from 'lucide-react';
import '../styles/Layout.css';

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/market', icon: Activity, label: 'Live Market' },
    { path: '/technical', icon: BarChart2, label: 'Technical Analysis' },
    { path: '/assets', icon: Book, label: 'Asset Reference' },
    { path: '/models', icon: Layers, label: 'Models' },
    { path: '/create-portfolio', icon: Plus, label: 'New Portfolio' },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <LineChart size={24} />
            <span>TradeSim</span>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
                  onClick={closeMobileMenu}
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
