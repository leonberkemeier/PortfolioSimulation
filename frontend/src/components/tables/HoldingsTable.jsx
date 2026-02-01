import { TrendingUp, TrendingDown } from 'lucide-react';

export default function HoldingsTable({ holdings }) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center">
        <p className="text-slate-400">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr className="text-slate-400">
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Ticker</th>
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Type</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Quantity</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Entry Price</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Current Price</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Value</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">P&L</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Return %</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => {
              const plColor = holding.unrealized_pl >= 0 ? 'text-green-400' : 'text-red-400';
              const plBgColor = holding.unrealized_pl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
              const isPositive = holding.unrealized_pl >= 0;
              
              return (
                <tr 
                  key={holding.id} 
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors duration-200 group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                        {holding.ticker.substring(0, 2)}
                      </div>
                      <span className="text-white font-bold">{holding.ticker}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-slate-700/50 rounded-md text-slate-300 text-xs uppercase font-medium">
                      {holding.asset_type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-white font-medium">{parseFloat(holding.quantity).toFixed(4)}</span>
                  </td>
                  <td className="py-4 px-6 text-right text-slate-400">
                    ${parseFloat(holding.entry_price).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-white font-medium">
                      {holding.current_price ? `$${parseFloat(holding.current_price).toFixed(2)}` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-white font-bold">
                      ${parseFloat(holding.current_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${plBgColor}`}>
                      {isPositive ? (
                        <TrendingUp size={14} className={plColor} />
                      ) : (
                        <TrendingDown size={14} className={plColor} />
                      )}
                      <span className={`font-bold ${plColor}`}>
                        ${parseFloat(holding.unrealized_pl).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-bold text-lg ${plColor}`}>
                      {isPositive ? '+' : ''}{parseFloat(holding.unrealized_pl_pct).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900/50 border-t border-slate-700/50">
            <tr>
              <td colSpan="5" className="py-4 px-6 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                Total Portfolio Value
              </td>
              <td className="py-4 px-6 text-right text-white font-bold text-lg">
                ${holdings.reduce((sum, h) => sum + parseFloat(h.current_value), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-6 text-right">
                <span className={`font-bold text-lg ${
                  holdings.reduce((sum, h) => sum + parseFloat(h.unrealized_pl), 0) >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  ${holdings.reduce((sum, h) => sum + parseFloat(h.unrealized_pl), 0).toFixed(2)}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
