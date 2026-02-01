export default function TransactionHistory({ transactions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700">
          <tr className="text-slate-400">
            <th className="text-left py-3 px-4 font-semibold">Date</th>
            <th className="text-left py-3 px-4 font-semibold">Type</th>
            <th className="text-left py-3 px-4 font-semibold">Ticker</th>
            <th className="text-left py-3 px-4 font-semibold">Asset Type</th>
            <th className="text-right py-3 px-4 font-semibold">Quantity</th>
            <th className="text-right py-3 px-4 font-semibold">Price</th>
            <th className="text-right py-3 px-4 font-semibold">Fee</th>
            <th className="text-right py-3 px-4 font-semibold">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const typeColor = tx.order_type === 'buy' ? 'text-green-400' : 'text-red-400';
            return (
              <tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
                <td className="py-3 px-4 text-slate-300 text-xs">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
                <td className={`py-3 px-4 font-semibold ${typeColor}`}>
                  {tx.order_type.toUpperCase()}
                </td>
                <td className="py-3 px-4 text-white font-semibold">{tx.ticker}</td>
                <td className="py-3 px-4 text-slate-300 text-xs uppercase">{tx.asset_type}</td>
                <td className="py-3 px-4 text-right text-white">
                  {parseFloat(tx.quantity).toFixed(4)}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  ${parseFloat(tx.price).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  ${parseFloat(tx.fee).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-white font-semibold">
                  ${parseFloat(tx.total_cost).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
