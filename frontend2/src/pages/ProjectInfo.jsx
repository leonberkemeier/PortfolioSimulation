import { Database, Brain, TrendingUp, Layers, GitBranch, Zap, BarChart3, Activity, Target, CheckCircle, ArrowRight } from 'lucide-react';
import '../styles/ProjectInfo.css';

export default function ProjectInfo() {
  return (
    <div className="project-info">
      {/* Hero Section */}
      <div className="project-info-hero">
        <h1>
          <TrendingUp size={40} />
          Financial Analysis Ecosystem
        </h1>
        <p>
          A complete quantitative trading research platform with end-to-end capabilities for algorithmic trading strategy development and testing
        </p>
        <div className="hero-stats">
          <div className="hero-stat-badge">
            <div className="label">Status</div>
            <div className="value">✅ Production Ready</div>
          </div>
          <div className="hero-stat-badge">
            <div className="label">Code Base</div>
            <div className="value">10,000+ lines</div>
          </div>
          <div className="hero-stat-badge">
            <div className="label">Updated</div>
            <div className="value">February 2026</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="info-section">
        <h2>
          <Target color="#3b82f6" />
          What This Is
        </h2>
        <p>
          Think of this as <span className="highlight">your personal quantitative hedge fund infrastructure</span>. 
          This ecosystem provides three interconnected systems that work together to collect financial data, develop ML trading strategies, 
          test them rigorously, and analyze results—all in one integrated platform.
        </p>
      </div>

      {/* Three Pillars */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers color="#8b5cf6" />
          The Three Pillars
        </h2>
        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-card blue">
            <div className="pillar-header">
              <div className="pillar-icon blue">
                <Database color="#3b82f6" size={24} />
              </div>
              <h3>Financial Data Aggregator</h3>
            </div>
            <p className="pillar-subtitle">The Data Warehouse</p>
            <ul className="pillar-features">
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Multi-source ETL pipelines (Yahoo Finance, FRED, CoinGecko, Alpha Vantage)</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>93,680+ price records across stocks, crypto, bonds, commodities</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Star schema database with historical OHLCV data</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Economic indicators & SEC filings</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-card purple">
            <div className="pillar-header">
              <div className="pillar-icon purple">
                <Brain color="#8b5cf6" size={24} />
              </div>
              <h3>Model Regime Comparison</h3>
            </div>
            <p className="pillar-subtitle">The ML Research Lab</p>
            <ul className="pillar-features">
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>4 ML architectures: Linear, CNN, XGBoost, LLM+RAG</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Tests which models excel in different market regimes</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Kelly Criterion position sizing</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Generates buy/sell signals with confidence scores</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-card green">
            <div className="pillar-header">
              <div className="pillar-icon green">
                <TrendingUp color="#10b981" size={24} />
              </div>
              <h3>Trading Simulator</h3>
            </div>
            <p className="pillar-subtitle">The Execution & Analytics Platform</p>
            <ul className="pillar-features">
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span><strong>You are here!</strong> This web interface</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Dual mode: Automated (ML models) + Manual (human traders)</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Order execution with realistic fee calculation</span>
              </li>
              <li>
                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                <span>Performance analytics: Sharpe, Sortino, VaR, drawdown</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Flow Diagram */}
      <div className="info-section">
        <h2>
          <GitBranch color="#10b981" />
          Complete Data Flow
        </h2>
        <div className="flow-diagram">
          <div className="flow-step">
            <div className="flow-box blue">
              <Database className="flow-icon" color="#3b82f6" size={32} />
              <div className="flow-title">Financial Data Aggregator</div>
              <div className="flow-desc">Collects AAPL historical prices</div>
            </div>
          </div>
          <ArrowRight className="flow-arrow" size={32} />
          <div className="flow-step">
            <div className="flow-box purple">
              <Brain className="flow-icon" color="#8b5cf6" size={32} />
              <div className="flow-title">Model Regime Comparison</div>
              <div className="flow-desc">XGBoost: "BUY AAPL, confidence 0.87"</div>
            </div>
          </div>
          <ArrowRight className="flow-arrow" size={32} />
          <div className="flow-step">
            <div className="flow-box green">
              <TrendingUp className="flow-icon" color="#10b981" size={32} />
              <div className="flow-title">Trading Simulator</div>
              <div className="flow-desc">Executes trade & tracks performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="features-grid">
        {/* For Researchers */}
        <div className="feature-card">
          <h3>
            <Activity color="#3b82f6" />
            For Quantitative Researchers
          </h3>
          <ul className="feature-list">
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Test if different ML architectures excel in different market regimes</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Deploy models that generate buy/sell signals programmatically</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Compare model performance side-by-side with advanced metrics</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Backtest strategies across 10 years of historical data</span>
            </li>
          </ul>
        </div>

        {/* For Traders */}
        <div className="feature-card">
          <h3>
            <BarChart3 color="#10b981" />
            For Traders & Investors
          </h3>
          <ul className="feature-list">
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Practice trading without risking real capital (paper trading)</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Create multiple portfolios with different risk profiles</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Execute trades through intuitive 3-step workflow</span>
            </li>
            <li>
              <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <span>Track performance with real-time charts and analytics</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Technical Stack */}
      <div className="info-section">
        <h2>Technology Stack</h2>
        <div className="tech-stack-grid">
          <div className="tech-column blue">
            <h4>Data Layer</h4>
            <ul className="tech-list">
              <li>Python 3.9+ ETL Pipelines</li>
              <li>SQLAlchemy ORM</li>
              <li>PostgreSQL / SQLite</li>
              <li>yfinance, fredapi APIs</li>
            </ul>
          </div>
          <div className="tech-column purple">
            <h4>ML Research Layer</h4>
            <ul className="tech-list">
              <li>scikit-learn (Linear)</li>
              <li>TensorFlow/Keras (CNN)</li>
              <li>XGBoost</li>
              <li>Ollama + ChromaDB (LLM+RAG)</li>
            </ul>
          </div>
          <div className="tech-column green">
            <h4>Trading Platform</h4>
            <ul className="tech-list">
              <li>FastAPI (Backend)</li>
              <li>React 18 + Vite (Frontend)</li>
              <li>Tailwind CSS (UI)</li>
              <li>Recharts (Visualization)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value blue">93,680+</div>
          <div className="metric-label">Price Records</div>
        </div>
        <div className="metric-card">
          <div className="metric-value purple">4</div>
          <div className="metric-label">ML Models</div>
        </div>
        <div className="metric-card">
          <div className="metric-value green">15+</div>
          <div className="metric-label">Performance Metrics</div>
        </div>
        <div className="metric-card">
          <div className="metric-value yellow">55+</div>
          <div className="metric-label">Unit Tests</div>
        </div>
      </div>

      {/* What Makes It Special */}
      <div className="special-section">
        <h2>What Makes This Special</h2>
        <p>
          Unlike standalone trading platforms or data tools, this ecosystem provides the complete infrastructure 
          similar to what a quantitative hedge fund would deploy. It bridges the gap between data collection, 
          strategy development, and execution—all while maintaining realistic trading conditions with fee structures, 
          risk management, and comprehensive analytics.
        </p>
        <div className="special-grid">
          <div className="special-card">
            <h4>✅ Complete Integration</h4>
            <p>
              Data flows seamlessly from collection → ML analysis → trade execution → performance tracking
            </p>
          </div>
          <div className="special-card">
            <h4>✅ Production Ready</h4>
            <p>
              10,000+ lines of tested code with comprehensive documentation and error handling
            </p>
          </div>
          <div className="special-card">
            <h4>✅ Research Focused</h4>
            <p>
              Designed to answer: "Do different ML models work better in different market conditions?"
            </p>
          </div>
          <div className="special-card">
            <h4>✅ Realistic Simulation</h4>
            <p>
              Includes trading fees, slippage, position limits, and professional risk metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
