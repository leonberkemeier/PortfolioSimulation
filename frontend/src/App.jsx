import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import './App.css';

// Import real components
import PortfolioDetail from './components/pages/PortfolioDetail';
import TradingInterface from './components/pages/TradingInterface';
import ModelComparison from './components/pages/ModelComparison';
import PortfolioCreationWizard from './components/pages/PortfolioCreationWizard';
import AnalyticsDashboard from './components/pages/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio/:id" element={<PortfolioDetail />} />
          <Route path="/portfolio/:id/trade" element={<TradingInterface />} />
          <Route path="/portfolio/:id/analytics" element={<AnalyticsDashboard />} />
          <Route path="/models" element={<ModelComparison />} />
          <Route path="/create-portfolio" element={<PortfolioCreationWizard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
