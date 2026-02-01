import { CheckCircle, ArrowRight } from 'lucide-react';

export default function OrderSuccess({ orderResult, portfolio, onBackToDashboard }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
      <div className="text-center mb-8">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white">Order Executed!</h2>
        <p className="text-slate-400 mt-2">Your order has been successfully processed.</p>
      </div>

      {/* Order Details */}
      <div className="bg-slate-700 rounded-lg p-6 space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Execution Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-slate-400 text-sm">Order ID</p>
            <p className="text-lg font-bold text-white mt-1">{orderResult.order_id || 'N/A'}</p>
          </div>
          <div className="border-l-2 border-green-500 pl-4">
            <p className="text-slate-400 text-sm">Status</p>
            <p className="text-lg font-bold text-green-400 mt-1">{orderResult.status.toUpperCase()}</p>
          </div>
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-slate-400 text-sm">Order Type</p>
            <p className={`text-lg font-bold mt-1 ${
              orderResult.orderType === 'buy' ? 'text-green-400' : 'text-red-400'
            }`}>
              {orderResult.orderType.toUpperCase()}
            </p>
          </div>
          <div className="border-l-2 border-blue-500 pl-4">
            <p className="text-slate-400 text-sm">Time</p>
            <p className="text-lg font-bold text-white mt-1">
              {new Date(orderResult.executedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-slate-700 rounded-lg p-6 space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-600 rounded">
            <span className="text-slate-300">Ticker</span>
            <span className="text-white font-semibold">{orderResult.ticker}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-600 rounded">
            <span className="text-slate-300">Asset Type</span>
            <span className="text-white font-semibold uppercase">{orderResult.asset_type}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-600 rounded">
            <span className="text-slate-300">Quantity</span>
            <span className="text-white font-semibold">{parseFloat(orderResult.quantity).toFixed(4)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-600 rounded">
            <span className="text-slate-300">Execution Price</span>
            <span className="text-white font-semibold">${parseFloat(orderResult.price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-600 rounded">
            <span className="text-slate-300">Fee</span>
            <span className="text-white font-semibold">${parseFloat(orderResult.fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-blue-900 border border-blue-700 rounded">
            <span className="text-blue-200 font-semibold">Total Cost</span>
            <span className="text-blue-100 font-bold text-lg">${parseFloat(orderResult.total_cost).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {orderResult.message && (
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <p className="text-slate-300 text-sm">{orderResult.message}</p>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-6">
        <p className="text-green-200 text-sm">
          ✓ Your order has been added to your portfolio. You can now view your updated holdings and continue trading.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onBackToDashboard}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        Back to Portfolio Details
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
