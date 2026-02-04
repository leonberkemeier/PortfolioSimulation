import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PortfolioDetail from './pages/PortfolioDetail';
import TradingInterface from './pages/TradingInterface';
import PortfolioCreationWizard from './pages/PortfolioCreationWizard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AssetReference from './pages/AssetReference';
import MarketView from './pages/MarketView';
import TechnicalAnalysis from './pages/TechnicalAnalysis';
import ChartComparison from './pages/ChartComparison';
import PortfolioRiskDashboard from './pages/PortfolioRiskDashboard';
import ProjectInfo from './pages/ProjectInfo';
import Login from './pages/Login';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<MarketView />} />
            <Route path="/compare" element={<ChartComparison />} />
            <Route path="/technical" element={<TechnicalAnalysis />} />
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
            <Route path="/portfolio/:id/risk" element={<PortfolioRiskDashboard />} />
            <Route path="/trade/:id" element={<TradingInterface />} />
            <Route path="/create-portfolio" element={<PortfolioCreationWizard />} />
            <Route path="/analytics/:id" element={<AnalyticsDashboard />} />
            <Route path="/assets" element={<AssetReference />} />
            <Route path="/info" element={<ProjectInfo />} />
            {/* Placeholder routes for future pages */}
            <Route path="/models" element={<Dashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
