# Phase 5: Frontend (Vite + React + JavaScript) - STARTED ✅

## What's Being Built

**Vite + React + JavaScript frontend** for the Trading Simulator with:
- ✅ Vite project initialized
- ✅ Dependencies installed (axios, recharts, tailwindcss)
- ✅ API service layer created
- ✅ Dashboard component with portfolio grid
- ✅ Portfolio card component
- ✅ Environment configuration

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx         - Main dashboard with portfolio list
│   │   └── PortfolioCard.jsx     - Individual portfolio card display
│   ├── services/
│   │   └── api.js               - Axios-based API service
│   ├── App.jsx
│   └── main.jsx
├── .env.example                 - Environment template
├── package.json                 - Dependencies
├── vite.config.js              - Vite configuration
└── index.html
```

## Dependencies Installed

- **react** 18+ - UI framework
- **axios** - HTTP client
- **recharts** - Charting library (for graphs)
- **tailwindcss** - Styling
- **postcss** - CSS processing
- **autoprefixer** - CSS prefixes

## API Service Layer

**File:** `src/services/api.js`

Organized endpoints:
```javascript
// Health check
healthCheck()

// Portfolios
portfolios.list(skip, limit)
portfolios.create(data)
portfolios.get(id)
portfolios.update(id, data)
portfolios.delete(id)

// Orders
orders.buy(portfolioId, data)
orders.sell(portfolioId, data)
orders.history(portfolioId, skip, limit)
orders.holdings(portfolioId)

// Analytics
analytics.performance(portfolioId)
analytics.snapshots(portfolioId, skip, limit)
analytics.risk(portfolioId)
analytics.allocation(portfolioId)
analytics.createSnapshot(portfolioId, date)
analytics.calculateMetrics(portfolioId, date)
```

## Dashboard Component

**File:** `src/components/Dashboard.jsx`

Features:
- ✅ Portfolio list with pagination
- ✅ Total NAV display
- ✅ Active portfolio counter
- ✅ Error handling
- ✅ Loading states
- ✅ Dark theme (Tailwind)

## Portfolio Card Component

**File:** `src/components/PortfolioCard.jsx`

Displays:
- Portfolio name and ID
- Status badge
- NAV (Net Asset Value)
- Initial capital
- Cash balance
- Total return % (color-coded: green for gains, red for losses)
- View details button

## How to Run

### Start Frontend Dev Server
```bash
cd frontend
npm install  # if not done
npm run dev
```

Opens at: `http://localhost:5173`

### Connect to Backend
```bash
# Make sure backend is running
cd backend
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Setup
```bash
cp .env.example .env.local
# Edit if needed (default points to localhost:8000)
```

## Next Components to Build

1. **Portfolio Detail Page**
   - Holdings table
   - Performance charts (NAV, returns over time)
   - Transaction history
   - Asset allocation pie chart

2. **Trading Interface**
   - Buy/sell form
   - Order confirmation
   - Real-time status

3. **Analytics Dashboard**
   - Risk metrics (Sharpe, Sortino, drawdown)
   - Volatility chart
   - Correlation heatmap
   - Liquidity score

4. **Model Comparison View**
   - Model performance metrics
   - Win rate comparison
   - Sector specialization
   - Signal history

5. **Navigation & Routing**
   - React Router for page navigation
   - Active portfolio context
   - Global state management (if needed)

## Styling

Using **Tailwind CSS** with:
- Dark theme (slate-900 backgrounds)
- Blue accent color (#3b82f6)
- Green for positive returns
- Red for negative returns
- Responsive grid layouts

## API Integration

The `api.js` service provides:
- ✅ Centralized endpoint management
- ✅ Error handling via interceptors
- ✅ Environment-based API URL
- ✅ Request/response logging
- ✅ Consistent error format

## Files Created

- `src/services/api.js` (63 lines)
- `src/components/Dashboard.jsx` (92 lines)
- `src/components/PortfolioCard.jsx` (42 lines)
- `.env.example` (1 line)

**Total:** ~198 lines of frontend code (foundation)

## Status

✅ **Phase 5 STARTED - Foundation Complete**
- Vite project initialized
- API service ready
- Core components in place
- Ready for feature development

Next: Build detail pages and analytics components
