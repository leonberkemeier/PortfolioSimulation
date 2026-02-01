import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function ExecutionStatus({ data }) {
  if (!data) return null;

  const { last_execution, next_execution, pending_orders, execution_log } = data;

  return (
    <div className="space-y-6">
      {/* Execution Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Last Execution */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-400" />
            <h3 className="text-lg font-semibold text-white">Last Execution</h3>
          </div>
          {last_execution ? (
            <div className="space-y-2">
              <p className="text-slate-300">
                <span className="text-slate-400">Date: </span>
                <span className="font-mono">{new Date(last_execution).toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-400">All pending orders were executed at market close.</p>
            </div>
          ) : (
            <p className="text-slate-400">No executions yet</p>
          )}
        </div>

        {/* Next Execution */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Next Execution</h3>
          </div>
          {next_execution ? (
            <div className="space-y-2">
              <p className="text-slate-300">
                <span className="text-slate-400">Expected: </span>
                <span className="font-mono">{new Date(next_execution).toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-400">Orders will execute at market close.</p>
            </div>
          ) : (
            <p className="text-slate-400">Next execution scheduled for market close</p>
          )}
        </div>
      </div>

      {/* Pending Orders */}
      {pending_orders && pending_orders.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Pending Orders ({pending_orders.length})</h3>
          </div>
          <div className="space-y-3">
            {pending_orders.map((order, idx) => (
              <div key={idx} className="bg-slate-700 rounded p-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">{order.ticker}</p>
                  <p className="text-sm text-slate-400">{order.quantity} shares @ ${order.limit_price?.toFixed(2) || 'market'}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-900 text-yellow-200 rounded-full text-xs font-semibold">
                  {order.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Log */}
      {execution_log && execution_log.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Execution Log</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {execution_log.map((entry, idx) => (
              <div key={idx} className="bg-slate-700 rounded p-3 border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold">{entry.ticker}</p>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  <span className={entry.action === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                    {entry.action}
                  </span>
                  {' '} {entry.quantity} @ ${entry.price.toFixed(2)}
                </p>
                {entry.notes && (
                  <p className="text-xs text-slate-400 mt-1">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {(!pending_orders || pending_orders.length === 0) && (!execution_log || execution_log.length === 0) && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center">
          <p className="text-slate-400">No pending orders or execution history</p>
        </div>
      )}
    </div>
  );
}
