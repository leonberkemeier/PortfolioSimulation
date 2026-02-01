import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PortfolioDetail from './pages/PortfolioDetail';
import TradingInterface from './pages/TradingInterface';
import PortfolioCreationWizard from './pages/PortfolioCreationWizard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AssetReference from './pages/AssetReference';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio/:id" element={<PortfolioDetail />} />
          <Route path="/trade/:id" element={<TradingInterface />} />
          <Route path="/create-portfolio" element={<PortfolioCreationWizard />} />
          <Route path="/analytics/:id" element={<AnalyticsDashboard />} />
          <Route path="/assets" element={<AssetReference />} />
          {/* Placeholder routes for future pages */}
          <Route path="/models" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
