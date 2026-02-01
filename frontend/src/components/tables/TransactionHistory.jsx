import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function TransactionHistory({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center">
        <p className="text-slate-400">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr className="text-slate-400">
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Date</th>
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Type</th>
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Ticker</th>
              <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-xs">Asset Type</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Quantity</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Price</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Fee</th>
              <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-xs">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => {
              const isBuy = tx.order_type === 'buy';
              const typeColor = isBuy ? 'text-green-400' : 'text-red-400';
              const typeBgColor = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
              
              return (
                <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors duration-200">
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {new Date(tx.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${typeBgColor}`}>
                      {isBuy ? (
                        <ArrowUpCircle size={14} className={typeColor} />
                      ) : (
                        <ArrowDownCircle size={14} className={typeColor} />
                      )}
                      <span className={`font-bold text-xs uppercase ${typeColor}`}>
                        {tx.order_type}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                        {tx.ticker.substring(0, 2)}
                      </div>
                      <span className="text-white font-bold">{tx.ticker}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-slate-700/50 rounded-md text-slate-300 text-xs uppercase font-medium">
                      {tx.asset_type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-white font-medium">
                    {parseFloat(tx.quantity).toFixed(4)}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-300">
                    ${parseFloat(tx.price).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-400">
                    ${parseFloat(tx.fee).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right text-white font-bold">
                    ${parseFloat(tx.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
