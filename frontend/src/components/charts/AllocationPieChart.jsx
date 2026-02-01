import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  stock: '#3b82f6',
  crypto: '#f59e0b',
  bond: '#10b981',
  commodity: '#8b5cf6',
  cash: '#6b7280',
};

export default function AllocationPieChart({ allocation }) {
  // Prepare data for pie chart
  const data = [
    { name: 'Stocks', value: allocation.stock || 0, key: 'stock' },
    { name: 'Crypto', value: allocation.crypto || 0, key: 'crypto' },
    { name: 'Bonds', value: allocation.bond || 0, key: 'bond' },
    { name: 'Commodities', value: allocation.commodity || 0, key: 'commodity' },
    { name: 'Cash', value: allocation.cash || 0, key: 'cash' },
  ].filter(item => item.value > 0 || item.key === 'cash');

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No allocation data available</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${value.toFixed(1)}%`}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Breakdown Table */}
      <div className="mt-6 space-y-2">
        {data.map((item) => (
          <div key={item.key} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.key] }}
              />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="text-white font-semibold">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
