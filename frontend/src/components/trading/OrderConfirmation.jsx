export default function OrderConfirmation({ formData, portfolio, onConfirm, onCancel, loading }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Confirm Order</h2>

      <div className="space-y-6">
        {/* Order Details */}
        <div className="bg-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Order Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Order Type</p>
              <p className={`text-xl font-bold mt-1 ${
                formData.orderType === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {formData.orderType.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Asset Type</p>
              <p className="text-xl font-bold text-white mt-1 uppercase">{formData.assetType}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Ticker</p>
              <p className="text-xl font-bold text-white mt-1">{formData.ticker}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Quantity</p>
              <p className="text-xl font-bold text-white mt-1">{parseFloat(formData.quantity).toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Portfolio Info */}
        <div className="bg-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Portfolio Impact</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Available Cash</p>
              <p className="text-xl font-bold text-white mt-1">
                ${parseFloat(portfolio.current_cash).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Portfolio NAV</p>
              <p className="text-xl font-bold text-white mt-1">
                ${parseFloat(portfolio.nav).toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm p-3 bg-slate-600 rounded">
            {formData.orderType === 'buy' 
              ? `This order will deduct from your available cash. Ensure you have sufficient funds.`
              : `This order will close or reduce your position. Ensure you have sufficient holdings.`
            }
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">
            <strong>⚠️ Important:</strong> Once you confirm, this order will be executed immediately. This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.orderType === 'buy'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Executing...' : 'Confirm & Execute'}
          </button>
        </div>
      </div>
    </div>
  );
}
