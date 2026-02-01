# Trading Simulator Frontend

**A professional React-based trading platform UI for managing multiple trading strategies, executing manual trades, and analyzing portfolio performance.**

---

## Overview

This frontend serves as the user interface for a comprehensive trading simulator platform that supports:
- **Model-Driven Trading**: Automated trading strategies from external models
- **Manual Paper Trading**: Users create and manage trading portfolios via GUI
- **Portfolio Analytics**: Comprehensive performance metrics, risk analysis, and visualizations
- **Model Comparison**: Compare multiple trading strategies side-by-side

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|----------|
| **Framework** | React | 18.x | UI component library |
| **Build Tool** | Vite | 7.3+ | Fast module bundler with HMR |
| **Routing** | React Router | 6.x | Client-side navigation |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **Charts** | Recharts | Latest | Data visualization (LineChart, PieChart) |
| **Icons** | Lucide React | Latest | SVG icon set |
| **HTTP Client** | Axios | Latest | API communication |

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start dev server
npm run dev
```

### Running the Platform

**Terminal 1 - Backend API** (must be running first)
```bash
cd ../backend
source venv/bin/activate
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend**
```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Features & Pages

### 1. Dashboard (Route: `/`)
Main landing page showing all portfolios with:
- Portfolio list with model/manual indicators (purple = model, blue = manual)
- Quick stats: NAV, initial capital, cash, return %
- "Details" button (all portfolios)
- "Trade" button (manual portfolios only)
- Summary statistics

### 2. Portfolio Detail (Route: `/portfolio/:id`)
Comprehensive portfolio view with:
- **Header**: Portfolio name, type indicator, status
- **Stats**: NAV, initial capital, cash, total return
- **Performance Chart**: NAV history visualization (LineChart)
- **Performance Metrics**: Sharpe/Sortino ratios, max drawdown, volatility
- **Tabbed Content**:
  - Holdings: Current positions with P&L
  - Transactions: Complete order history
- **Trade Button**: Link to trading interface (manual only)

### 3. Trading Interface (Route: `/portfolio/:id/trade`)
3-step order execution flow:
1. **Order Form**: Buy/Sell tabs, ticker, asset type, quantity with validation
2. **Confirmation**: Order summary, portfolio impact, warning
3. **Success**: Execution confirmation with order ID and transaction details

**Features**:
- Portfolio guard (blocks model-managed portfolios)
- Real-time form validation with error clearing
- Color-coded buy (green) / sell (red) buttons
- Available cash display
- Decimal quantity support

### 4. Portfolio Creation Wizard (Route: `/create-portfolio`)
4-step wizard for creating manual trading portfolios:
1. **Basic Info**: Name, description, initial capital
2. **Risk Settings**: Max position size, max cash/trade, max allocation per asset class
3. **Fee Structure**: Select fee type (currently "No Fees")
4. **Confirmation**: Review and create

**Features**:
- Progress indicator with visual steps
- Step-by-step validation
- Error messages with real-time clearing
- Back/Next navigation
- Success page with portfolio ID and links

### 5. Model Comparison (Route: `/models`)
Compare multiple trading models/strategies:
- **Model Cards**: Portfolio count, combined NAV, avg return, combined P&L (clickable)
- **Comparison Table**: Side-by-side metrics with totals row
- **Selected Model Details**: List all portfolios for selected model
- **Summary Stats**: Total models, portfolios, combined NAV, combined P&L

### 6. Analytics Dashboard (Route: `/portfolio/:id/analytics`)
Comprehensive performance and risk analysis:
- **NAV Chart**: LineChart showing portfolio value over time
- **Performance Metrics**: Sharpe/Sortino, Max Drawdown, Volatility, Win Rate, Total Trades
- **Asset Allocation**: PieChart showing distribution (Stock/Crypto/Bond/Commodity/Cash)
- **Risk Analysis**: VaR 95%, VaR 99%, Current Drawdown, Liquidity Score
- **Summary Cards**: NAV, cash, deployed %, total return

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx                  # Portfolio list landing page
│   ├── Layout.jsx                     # Sidebar navigation wrapper
│   ├── PortfolioCard.jsx              # Individual portfolio card
│   ├── PortfolioTypeIndicator.jsx     # Model/Manual badge
│   ├── LoadingSpinner.jsx             # Loading animation
│   ├── ErrorMessage.jsx               # Error display
│   ├── pages/
│   │   ├── PortfolioDetail.jsx        # Portfolio details page
│   │   ├── TradingInterface.jsx       # Order execution flow
│   │   ├── PortfolioCreationWizard.jsx # Portfolio creation wizard
│   │   ├── ModelComparison.jsx        # Model comparison page
│   │   └── AnalyticsDashboard.jsx     # Analytics page
│   ├── trading/
│   │   ├── OrderForm.jsx              # Buy/sell form
│   │   ├── OrderConfirmation.jsx      # Order confirmation
│   │   └── OrderSuccess.jsx           # Success page
│   ├── tables/
│   │   ├── HoldingsTable.jsx          # Holdings table
│   │   ├── TransactionHistory.jsx     # Transaction table
│   │   ├── ModelCard.jsx              # Model card
│   │   └── ModelPerformanceTable.jsx  # Comparison table
│   └── charts/
│       ├── NAVChart.jsx               # NAV history chart
│       ├── PerformanceChart.jsx       # Performance chart
│       ├── AllocationPieChart.jsx     # Allocation pie
│       └── RiskMetricsPanel.jsx       # Risk metrics cards
├── services/
│   └── api.js                         # Axios service (14+ endpoints)
├── App.jsx                            # Router & main app
├── main.jsx                           # Vite entry point
└── App.css                            # Global styles
```

---

## API Integration

### Service Layer
All API calls organized in `src/services/api.js`:

```javascript
// Portfolio Management
portfolios.list(skip, limit)     // GET /portfolios
portfolios.create(data)          // POST /portfolios
portfolios.get(id)               // GET /portfolios/{id}
portfolios.update(id, data)      // PUT /portfolios/{id}
portfolios.delete(id)            // DELETE /portfolios/{id}

// Order Execution
orders.buy(portfolioId, data)    // POST /orders/{id}/buy
orders.sell(portfolioId, data)   // POST /orders/{id}/sell
orders.history(portfolioId)      // GET /orders/{id}/history
orders.holdings(portfolioId)     // GET /orders/{id}/holdings

// Analytics
analytics.performance(id)        // GET /analytics/{id}/performance
analytics.snapshots(id)          // GET /analytics/{id}/snapshots
analytics.risk(id)               // GET /analytics/{id}/risk
analytics.allocation(id)         // GET /analytics/{id}/allocation
analytics.createSnapshot(id)     // POST /analytics/{id}/snapshot
analytics.calculateMetrics(id)   // POST /analytics/{id}/metrics
```

### Environment Configuration
Update `.env.local`:
```
VITE_API_URL=http://localhost:8001/api
```

---

## Component Stats

- **Total Components**: 20+
- **Total Lines of Code**: 2000+
- **Pages**: 5 (PortfolioDetail, Trading, Wizard, Comparison, Analytics)
- **Charts**: 4 (NAVChart, PerformanceChart, AllocationPieChart, RiskMetricsPanel)
- **Tables**: 4 (HoldingsTable, TransactionHistory, ModelCard, ModelPerformanceTable)
- **Shared**: 4 (LoadingSpinner, ErrorMessage, PortfolioTypeIndicator, Layout)

---

## Key Design Patterns

### Model vs Manual Detection
- Implementation: Check `portfolio.model_name` field
- Non-null = model-managed (purple badge)
- Null = manual (blue badge)
- Trade button only shows for manual portfolios

### Error Handling
- Global API error interceptor
- Component-level try/catch blocks
- Graceful degradation for missing data
- User-friendly error messages

### Styling
- Dark theme: Slate (900-800-700) + blue accents
- Tailwind CSS utilities
- Responsive grid layouts
- Color-coded metrics: Green (success), Red (error), Yellow (warning)

---

## Build & Deploy

### Development
```bash
npm run dev      # Start with HMR
```

### Production
```bash
npm run build    # Build optimized bundle
npm run preview  # Preview production build
```

---

## Known Limitations

1. No real-time updates (page refresh required)
2. Single-user only (no authentication)
3. Only "No Fees" in portfolio wizard
4. Fixed 50-item pagination limits
5. Desktop-optimized (mobile not fully tested)

---

## Future Enhancements

- WebSocket for real-time updates
- Advanced filtering and sorting
- Data export (CSV/PDF)
- Dark/Light theme toggle
- Portfolio comparison
- Model signal visualization

---

## Support

For issues:
1. Check backend health: `http://localhost:8001/health`
2. Verify `.env.local` has correct API URL
3. Check browser console for errors
4. Ensure backend is running

---

**Status**: ✅ Production-Ready  
Last Updated: 2026-02-01
