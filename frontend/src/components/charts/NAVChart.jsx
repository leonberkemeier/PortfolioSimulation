import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function NAVChart({ snapshots }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="glass rounded-xl p-16 text-center">
        <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No chart data available yet</p>
        <p className="text-slate-500 text-sm mt-2">Performance data will appear here once portfolio snapshots are created</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = snapshots
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((snapshot) => ({
      date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      nav: parseFloat(snapshot.nav),
      return: parseFloat(snapshot.total_return),
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isPositive = payload[0].value >= chartData[0].nav;
      return (
        <div className="glass rounded-lg p-4 shadow-xl border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-2 font-medium">{label}</p>
          <div className="space-y-1">
            <p className="text-white font-bold text-lg">
              ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{((payload[0].value - chartData[0].nav) / chartData[0].nav * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">Portfolio Value Over Time</h3>
        <p className="text-slate-400 text-sm">Net Asset Value (NAV) history</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            style={{ fontSize: '12px', fontWeight: '500' }}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '12px', fontWeight: '500' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="nav"
            stroke="#3b82f6"
            fill="url(#navGradient)"
            strokeWidth={3}
            name="NAV"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
