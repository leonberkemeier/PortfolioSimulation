export default function ModelPerformanceTable({ metrics, modelNames }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-700 bg-slate-900">
          <tr className="text-slate-400">
            <th className="text-left py-4 px-4 font-semibold">Model / Strategy</th>
            <th className="text-right py-4 px-4 font-semibold">Portfolios</th>
            <th className="text-right py-4 px-4 font-semibold">Combined NAV</th>
            <th className="text-right py-4 px-4 font-semibold">Initial Capital</th>
            <th className="text-right py-4 px-4 font-semibold">Avg Return %</th>
            <th className="text-right py-4 px-4 font-semibold">Combined P&L</th>
            <th className="text-right py-4 px-4 font-semibold">P&L %</th>
          </tr>
        </thead>
        <tbody>
          {modelNames.map((modelName) => {
            const data = metrics[modelName];
            const totalInitial = data.portfolios.reduce(
              (sum, p) => sum + parseFloat(p.initial_capital),
              0
            );
            const pnlPercent = totalInitial > 0 ? (data.totalPnL / totalInitial) * 100 : 0;
            const returnColor = data.avgReturn >= 0 ? 'text-green-400' : 'text-red-400';
            const pnlColor = data.totalPnL >= 0 ? 'text-green-400' : 'text-red-400';

            return (
              <tr key={modelName} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                <td className="py-4 px-4 text-white font-semibold">{modelName}</td>
                <td className="py-4 px-4 text-right text-white font-semibold">
                  {data.portfolioCount}
                </td>
                <td className="py-4 px-4 text-right text-white font-semibold">
                  ${data.totalNav.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  ${totalInitial.toFixed(2)}
                </td>
                <td className={`py-4 px-4 text-right font-semibold ${returnColor}`}>
                  {data.avgReturn.toFixed(2)}%
                </td>
                <td className={`py-4 px-4 text-right font-semibold ${pnlColor}`}>
                  ${data.totalPnL.toFixed(2)}
                </td>
                <td className={`py-4 px-4 text-right font-semibold ${pnlColor}`}>
                  {pnlPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer with totals */}
      <div className="bg-slate-900 border-t border-slate-700 p-4">
        <div className="flex justify-between items-center text-white font-semibold">
          <span>TOTAL</span>
          <div className="flex gap-12 text-right">
            <span>{modelNames.reduce((sum, m) => sum + metrics[m].portfolioCount, 0)}</span>
            <span>
              ${modelNames.reduce((sum, m) => sum + metrics[m].totalNav, 0).toFixed(2)}
            </span>
            <span>
              ${modelNames.reduce((sum, m) => {
                return sum + (m === 'Manual Portfolios' 
                  ? 0 
                  : metrics[m].portfolios.reduce((s, p) => s + parseFloat(p.initial_capital), 0));
              }, 0).toFixed(2)}
            </span>
            <span className="text-green-400">
              {(modelNames.reduce((sum, m) => sum + metrics[m].totalReturn, 0) / modelNames.length).toFixed(2)}%
            </span>
            <span className="text-green-400">
              ${modelNames.reduce((sum, m) => sum + metrics[m].totalPnL, 0).toFixed(2)}
            </span>
            <span className="text-green-400">
              {(() => {
                const totalPnL = modelNames.reduce((sum, m) => sum + metrics[m].totalPnL, 0);
                const totalInitial = modelNames.reduce((sum, m) => {
                  return sum + metrics[m].portfolios.reduce((s, p) => s + parseFloat(p.initial_capital), 0);
                }, 0);
                return totalInitial > 0 ? ((totalPnL / totalInitial) * 100).toFixed(2) : '0.00';
              })()}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
