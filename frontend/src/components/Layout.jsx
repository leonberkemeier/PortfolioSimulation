import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, TrendingUp, Settings, Plus, Layers } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'bg-blue-600' : '';
  
  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">TradeSim</h1>
          <p className="text-slate-400 text-sm">Paper Trading Platform</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:bg-slate-700 transition ${isActive('/')}`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link
            to="/models"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:bg-slate-700 transition ${isActive('/models')}`}
          >
            <Layers size={20} />
            <span>Models</span>
          </Link>
          
          <Link
            to="/create-portfolio"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:bg-slate-700 transition ${isActive('/create-portfolio')}`}
          >
            <Plus size={20} />
            <span>New Portfolio</span>
          </Link>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-400 text-xs text-center">
            Trading Simulator v1.0
          </p>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
