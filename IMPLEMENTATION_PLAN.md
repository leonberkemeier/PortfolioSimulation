# Trading Simulator Implementation Plan

## Problem Statement
Build a stock portfolio simulator that bridges ML models (model_regime_comparison) with realistic trading logic. Support multiple portfolios, diverse asset classes (stocks, crypto, bonds, commodities), configurable fee structures, and provide both REST API and React dashboard for monitoring.

## Current State
- **financial_data_aggregator**: Populated SQLite database with stocks, crypto, bonds, commodities, economic data
- **model_regime_comparison**: ML models ready to generate trading signals (Linear, CNN, XGBoost, LLM+RAG)
- **Trading_Simulator**: Empty directory, ready for implementation

## Proposed Architecture

### Backend (FastAPI + SQLAlchemy)

**Core Modules:**

1. **Portfolio Management** (`src/models/portfolio.py`)
   - Portfolio entity with ID, name, initial capital, creation date
   - Holdings: asset type, ticker, quantity, entry price, current price
   - Cash balance, NAV (net asset value), total return
   - Track all transactions with timestamps

2. **Order Engine** (`src/services/order_engine.py`)
   - Buy/sell order processing with validation
   - Check: sufficient cash, valid ticker, market hours (optional)
   - Calculate fees based on configurable strategies
   - Execute at next available price from financial_data_aggregator
   - Return order confirmation with fill price, fee, net cost

3. **Fee Management** (`src/models/fee_structure.py`)
   - Multiple fee scenarios: flat fee, percentage, tiered, zero
   - Per-portfolio fee assignment
   - Fee calculation: transaction amount × fee_percent + flat_fee
   - Support A/B testing different fee models

4. **Asset Support** (`src/models/asset.py`)
   - Asset types: stock, crypto, bond, commodity
   - Load tickers from financial_data_aggregator dimensions
   - Price lookup from fact tables (stock, crypto, bond, commodity)
   - Validation against available data

5. **Performance Tracking** (`src/services/performance_calculator.py`)
   - Daily NAV calculation
   - Returns: total %, YTD, period-specific
   - Risk metrics: Sharpe ratio, Sortino, max drawdown, volatility
   - Win rate (profitable trades)
   - Correlation analysis across holdings

6. **REST API** (`src/api/routes/`)
   - `POST /api/portfolios` - Create portfolio with initial capital, name, fee structure
   - `GET /api/portfolios` - List all portfolios with summary stats
   - `GET /api/portfolios/{id}` - Detailed view: holdings, cash, NAV, returns
   - `POST /api/portfolios/{id}/orders` - Place buy/sell order (symbol, qty, order_type, fee_scenario)
   - `GET /api/portfolios/{id}/orders` - Order history with fills
   - `GET /api/portfolios/{id}/holdings` - Current positions
   - `GET /api/portfolios/{id}/performance` - Daily NAV, returns, metrics
   - `GET /api/portfolios/{id}/risk-analytics` - VaR, correlation, drawdown
   - `DELETE /api/portfolios/{id}` - Archive portfolio

### Database Schema (SQLAlchemy Models)

**Tables:**
- `Portfolio`: id, name, initial_capital, current_cash, creation_date, status, model_name
- `FeeStructure`: id, name, fee_type (flat/percent/tiered/zero), fee_amount, description
- `PortfolioFeeAssignment`: portfolio_id, fee_structure_id
- `Holding`: id, portfolio_id, asset_type, ticker, quantity, entry_price, entry_date
- `Transaction`: id, portfolio_id, ticker, type (buy/sell), quantity, price, fee, timestamp
- `PortfolioSnapshot`: portfolio_id, date, nav, total_return, cash_balance (daily)
- `PerformanceMetric`: portfolio_id, date, sharpe, sortino, max_dd, volatility, win_rate
- `ModelSignal`: id, portfolio_id, ticker, signal_type (buy/sell/hold), confidence, model_name, timestamp
- `RiskMetric`: portfolio_id, date, var_95, correlation_matrix, drawdown, sector_allocation

### Frontend (Vite + React + JavaScript)

**Components:**

1. **Dashboard**: 
   - Overview of all portfolios with net worth
   - Allocation pie chart across asset types
   - Model performance comparison (Linear vs CNN vs XGBoost vs LLM)
   - Active trades summary

2. **Portfolio Detail**: 
   - Holdings table with current prices and P&L
   - Transaction history with fees
   - Performance charts (NAV over time, returns distribution)
   - Asset allocation by type (stocks, crypto, bonds, commodities)

3. **Trading Interface**: 
   - Buy/sell form with fee calculator preview
   - Model signal visualization (which models recommend what)
   - Order execution confirmation
   - Real-time order status

4. **Model Comparison View**:
   - Side-by-side performance metrics for each model (Linear, CNN, XGBoost, LLM)
   - Win rate comparison
   - Sharpe ratio per model
   - Signal confidence visualization
   - Sector specialization heatmap (showing which models excel in which sectors)
   - Power law scatter (win rate vs payoff per model)

5. **Fee Comparison**: 
   - Simulate same portfolio under different fee structures
   - Impact on returns visualization
   - Fee vs performance tradeoff analysis

6. **Risk Analytics**: 
   - Volatility trends
   - Drawdown chart with annotations
   - Correlation heatmap across holdings
   - Value at Risk (VaR) display
   - Sector rotation tracking

7. **Order Book**: 
   - Live order status
   - Execution history with fill prices
   - Model signal source (which model placed the trade)

**Tech Stack:**
- React 18 + JavaScript (no TypeScript)
- Vite for build tooling
- Recharts for visualizations
- TanStack Query for data fetching
- Tailwind CSS for styling
- Axios for API calls
- Chart.js for specialized charts (correlation heatmap, sector heatmap)

**Styling Approach:**
- Dark theme with accent colors per model (Blue for Linear, Purple for CNN, Orange for XGBoost, Green for LLM)
- Real-time updates with WebSocket optional upgrade
- Responsive mobile-friendly design

## Implementation Phases

### Phase 1: Foundation (Database + Core Models)
- Set up SQLAlchemy models for Portfolio, Holding, Transaction, FeeStructure, ModelSignal, RiskMetric
- Implement PortfolioSnapshot and PerformanceMetric tables
- Database initialization script
- Connection to financial_data_aggregator database for price lookups
- Estimated: 2-3 hours

### Phase 2: Order Engine & Fee System
- Implement order validation and execution
- Multiple fee structure options (flat, percent, tiered, zero)
- Transaction logging
- Price lookup from financial_data_aggregator
- Unit tests for order logic
- Estimated: 3-4 hours

### Phase 3: Performance Calculation
- NAV calculation (holdings value + cash)
- Returns computation (total, YTD, period)
- Risk metrics: Sharpe, Sortino, max drawdown, volatility
- Win rate calculation (profitable trades)
- Correlation calculation across holdings
- Daily snapshot generation
- Estimated: 3-4 hours

### Phase 4: REST API
- FastAPI setup with CORS for frontend
- All endpoints from spec above
- Input validation with Pydantic
- Error handling and logging
- API documentation (auto-generated)
- Model signal integration endpoint
- Estimated: 4-5 hours

### Phase 5: React Frontend (Vite)
- Vite project setup (React + JavaScript)
- Dashboard with portfolio summary
- Portfolio detail page with holdings
- Trading interface (buy/sell forms)
- Performance charts and analytics
- Responsive design
- Basic model comparison view
- Estimated: 10-12 hours

### Phase 6: Model-Specific Visualizations
- Model performance comparison charts
- Win rate per model visualization
- Sharpe ratio per model
- Signal confidence display
- Sector specialization heatmap
- Power law scatter plot (win rate vs payoff)
- Model-colored trading signals
- Estimated: 4-5 hours

### Phase 7: Advanced Analytics Dashboard
- Risk analytics: VaR, correlation, drawdown charts
- Fee comparison scenarios
- Sector rotation tracking
- Real-time WebSocket updates (optional)
- Estimated: 3-4 hours

### Phase 8: Integration & Polish
- Connect backend to financial_data_aggregator price data
- Fee comparison view (simulate same trades under different fees)
- Backtesting support (replay historical trades)
- Model signal replay and analysis
- Documentation and deployment guide
- Estimated: 3-4 hours

## Key Design Decisions

1. **Fee Flexibility**: Store fee structure as reusable entity, apply per-portfolio. Allows comparing same portfolio under different fees.

2. **Asset Agnostic**: Order engine works with any asset type from financial_data_aggregator (stock/crypto/bond/commodity).

3. **Performance Snapshots**: Daily snapshots enable fast historical queries without recalculating.

4. **API-First**: Design API independently, frontend consumes it. Allows model_regime_comparison to integrate later.

5. **Modular Metrics**: Risk analytics pluggable, easy to add new metrics (Calmar ratio, Omega, etc.).

6. **Model Tracking**: All trades tagged with originating model name. Enables direct performance comparison between Linear, CNN, XGBoost, and LLM strategies.

7. **Color-Coded UI**: Each model has a distinct color for easy visual identification across charts and tables.

8. **Signal Confidence**: Store confidence scores from models to visualize certainty of trades.

## Integration Points

**With financial_data_aggregator:**
- Price lookups: `fact_stock_price`, `fact_crypto_price`, `fact_bond_price`, `fact_commodity_price`
- Asset metadata: `dim_company`, `dim_crypto_asset`, `dim_bond`, `dim_commodity`
- Economic indicators for fundamental analysis

**With model_regime_comparison:**
- API for placing orders (POSTing to `/portfolios/{id}/orders`)
- Model signals endpoint for predictions
- Performance tracking (GETting `/portfolios/{id}/performance`)
- Risk analytics (GETting `/portfolios/{id}/risk-analytics`)
- Model comparison endpoint for cross-model analysis
- Direct integration with Kelly Criterion position sizing

## Success Criteria

- ✅ Create/manage multiple portfolios
- ✅ Buy/sell across asset types with configurable fees
- ✅ Track NAV, returns, risk metrics
- ✅ REST API fully functional
- ✅ React dashboard displaying all data
- ✅ Model-specific visualizations (Linear, CNN, XGBoost, LLM comparison)
- ✅ Fee comparison scenarios
- ✅ Risk analytics with correlation, VaR, drawdown
- ✅ Ready for ML model integration
- ✅ Signal confidence and sector specialization visualization

## Project Structure

```
Trading_Simulator/
├── backend/
│   ├── src/
│   │   ├── __init__.py
│   │   ├── config.py                          # Configuration
│   │   ├── database.py                        # SQLAlchemy setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── portfolio.py                   # Portfolio model
│   │   │   ├── holding.py                     # Holdings model
│   │   │   ├── transaction.py                 # Transaction model
│   │   │   ├── fee_structure.py               # Fee structures
│   │   │   ├── snapshot.py                    # Portfolio snapshots
│   │   │   ├── performance_metric.py           # Performance metrics
│   │   │   ├── model_signal.py                # Model signals
│   │   │   └── risk_metric.py                 # Risk metrics
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── order_engine.py                # Order processing
│   │   │   ├── performance_calculator.py      # Metrics calculation
│   │   │   ├── price_lookup.py                # Price data from aggregator
│   │   │   ├── risk_calculator.py             # Risk metrics computation
│   │   │   └── portfolio_manager.py           # Portfolio operations
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                        # FastAPI app
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── portfolios.py              # Portfolio endpoints
│   │   │       ├── orders.py                  # Order endpoints
│   │   │       ├── analytics.py               # Analytics endpoints
│   │   │       └── models.py                  # Model comparison endpoints
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── logger.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_order_engine.py
│   │   ├── test_performance_calculator.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PortfolioDetail.jsx
│   │   │   ├── TradingInterface.jsx
│   │   │   ├── ModelComparison.jsx
│   │   │   ├── RiskAnalytics.jsx
│   │   │   ├── FeeComparison.jsx
│   │   │   ├── OrderBook.jsx
│   │   │   └── charts/
│   │   │       ├── NAVChart.jsx
│   │   │       ├── CorrelationHeatmap.jsx
│   │   │       ├── AllocationChart.jsx
│   │   │       ├── ModelPerformanceChart.jsx
│   │   │       ├── DrawdownChart.jsx
│   │   │       └── SectorHeatmap.jsx
│   │   ├── hooks/
│   │   │   ├── usePortfolio.js
│   │   │   ├── useOrders.js
│   │   │   └── useAnalytics.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── IMPLEMENTATION_PLAN.md
└── README.md
```

## Technology Stack Summary

**Backend:**
- FastAPI 0.104+
- SQLAlchemy 2.0+
- SQLite (or PostgreSQL for production)
- Python 3.9+
- Pydantic for validation
- pytest for testing

**Frontend:**
- Vite 5.0+
- React 18+
- JavaScript (no TypeScript)
- Recharts for line/bar/pie charts
- Chart.js for specialized visualizations
- Tailwind CSS for styling
- TanStack Query v5 for state management
- Axios for HTTP requests

## Next Steps

1. Review this plan and confirm direction
2. Set up backend project structure (Phase 1)
3. Implement database models
4. Build order engine and fee system
5. Create REST API endpoints
6. Set up Vite + React frontend
7. Build dashboard and visualizations
8. Add model comparison features
9. Integrate with financial_data_aggregator
10. Deploy and test end-to-end
