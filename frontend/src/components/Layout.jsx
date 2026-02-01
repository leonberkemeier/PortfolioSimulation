import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, TrendingUp, Settings, Plus, Layers, LineChart, Zap } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard', color: 'blue' },
    { path: '/models', icon: Layers, label: 'Models', color: 'purple' },
    { path: '/create-portfolio', icon: Plus, label: 'New Portfolio', color: 'green' },
  ];
  
  return (
    <div className="flex flex-row w-screen h-screen bg-slate-950 overflow-hidden">
      {/* Enhanced Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col shadow-2xl overflow-y-auto">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LineChart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                TradeSim
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm ml-13 font-medium">Professional Trading Platform</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="text-xs text-slate-600 uppercase font-bold tracking-wider px-3 mb-3">Navigation</p>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                
                <div className={`
                  p-1.5 rounded-lg transition-all duration-300
                  ${active 
                    ? 'bg-white/20' 
                    : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                  }
                `}>
                  <Icon size={18} />
                </div>
                
                <span className="text-sm font-semibold">{item.label}</span>
                
                {/* Hover effect */}
                {!active && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/5 group-hover:to-purple-600/5 transition-all duration-300"></div>
                )}
              </Link>
            );
          })}
          
          {/* Divider */}
          <div className="py-4">
            <div className="h-px bg-slate-800/50"></div>
          </div>
          
          {/* Quick Stats */}
          <div className="px-3 py-4 bg-slate-800/30 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-yellow-400" size={14} />
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Quick Stats</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access your portfolio metrics and performance data from the dashboard.
            </p>
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="px-3 py-4 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                TS
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Trading Simulator</p>
                <p className="text-xs text-slate-500">Version 1.0</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <Outlet />
      </main>
    </div>
  );
}
