import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function IntradayChart({ data, height = 300 }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-400 text-center py-8">No chart data available</div>;
  }
  
  // Format data for Recharts
  const chartData = data.map(([timestamp, price]) => ({
    time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    price: parseFloat(price).toFixed(2),
    timestamp
  }));
  
  // Calculate min/max for domain
  const prices = data.map(([_, price]) => parseFloat(price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="time" 
          stroke="#94a3b8" 
          style={{ fontSize: '11px' }}
          tick={{ fill: '#94a3b8' }}
        />
        <YAxis 
          stroke="#94a3b8" 
          style={{ fontSize: '11px' }}
          tick={{ fill: '#94a3b8' }}
          domain={[minPrice - padding, maxPrice + padding]}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '8px'
          }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(value) => `$${value}`}
          cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
