import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function NAVChart({ snapshots }) {
  if (!snapshots || snapshots.length === 0) {
    return <div className="text-slate-400 p-8 text-center">No chart data available</div>;
  }

  // Format data for chart
  const chartData = snapshots
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((snapshot) => ({
      date: new Date(snapshot.date).toLocaleDateString(),
      nav: parseFloat(snapshot.nav),
      return: parseFloat(snapshot.total_return),
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value) => `$${value.toFixed(2)}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="nav"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
          name="NAV"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
