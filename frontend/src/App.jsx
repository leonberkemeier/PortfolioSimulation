import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import './App.css';

// Import real components
import PortfolioDetail from './components/pages/PortfolioDetail';
import TradingInterface from './components/pages/TradingInterface';

// Placeholder pages (to be implemented)
const AnalyticsDashboard = () => <div className="p-8"><h1 className="text-3xl font-bold text-white">Analytics Dashboard - Coming Soon</h1></div>;
const ModelComparison = () => <div className="p-8"><h1 className="text-3xl font-bold text-white">Model Comparison - Coming Soon</h1></div>;
const PortfolioCreationWizard = () => <div className="p-8"><h1 className="text-3xl font-bold text-white">Create Portfolio - Coming Soon</h1></div>;

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
