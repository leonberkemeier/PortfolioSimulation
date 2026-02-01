export default function HoldingsTable({ holdings }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700">
          <tr className="text-slate-400">
            <th className="text-left py-3 px-4 font-semibold">Ticker</th>
            <th className="text-left py-3 px-4 font-semibold">Type</th>
            <th className="text-right py-3 px-4 font-semibold">Quantity</th>
            <th className="text-right py-3 px-4 font-semibold">Entry Price</th>
            <th className="text-right py-3 px-4 font-semibold">Current Price</th>
            <th className="text-right py-3 px-4 font-semibold">Value</th>
            <th className="text-right py-3 px-4 font-semibold">P&L</th>
            <th className="text-right py-3 px-4 font-semibold">Return %</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const plColor = holding.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400';
            return (
              <tr key={holding.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
                <td className="py-3 px-4 text-white font-semibold">{holding.ticker}</td>
                <td className="py-3 px-4 text-slate-300 text-xs uppercase">{holding.asset_type}</td>
                <td className="py-3 px-4 text-right text-white">{parseFloat(holding.quantity).toFixed(4)}</td>
                <td className="py-3 px-4 text-right text-slate-300">
                  ${parseFloat(holding.entry_price).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  {holding.current_price ? `$${parseFloat(holding.current_price).toFixed(2)}` : 'N/A'}
                </td>
                <td className="py-3 px-4 text-right text-white font-semibold">
                  ${parseFloat(holding.current_value).toFixed(2)}
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${plColor}`}>
                  ${parseFloat(holding.unrealized_pl).toFixed(2)}
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${plColor}`}>
                  {parseFloat(holding.unrealized_pl_pct).toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
