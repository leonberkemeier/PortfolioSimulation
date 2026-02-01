import { useState } from 'react';

const ASSET_TYPES = ['stock', 'crypto', 'bond', 'commodity'];

export default function OrderForm({ portfolio, onSubmit }) {
  const [orderType, setOrderType] = useState('buy');
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('stock');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!ticker.trim()) {
      newErrors.ticker = 'Ticker is required';
    } else if (ticker.length > 20) {
      newErrors.ticker = 'Ticker must be 20 characters or less';
    }

    if (!quantity) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    if (!assetType) {
      newErrors.assetType = 'Asset type is required';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      orderType,
      ticker: ticker.toUpperCase(),
      assetType,
      quantity,
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Place Order</h2>

      {/* Order Type Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700 pb-4">
        {['buy', 'sell'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setOrderType(type);
              setErrors({});
            }}
            className={`px-6 py-2 font-semibold rounded-lg transition ${
              orderType === type
                ? type === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticker Input */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
              if (errors.ticker) setErrors({ ...errors, ticker: '' });
            }}
            placeholder="e.g., AAPL, BTC"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {errors.ticker && <p className="text-red-400 text-sm mt-1">{errors.ticker}</p>}
        </div>

        {/* Asset Type */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2">Asset Type</label>
          <div className="grid grid-cols-2 gap-3">
            {ASSET_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition"
              >
                <input
                  type="radio"
                  name="assetType"
                  value={type}
                  checked={assetType === type}
                  onChange={(e) => {
                    setAssetType(e.target.value);
                    if (errors.assetType) setErrors({ ...errors, assetType: '' });
                  }}
                  className="w-4 h-4"
                />
                <span className="text-white capitalize">{type}</span>
              </label>
            ))}
          </div>
          {errors.assetType && <p className="text-red-400 text-sm mt-1">{errors.assetType}</p>}
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-slate-300 font-semibold mb-2">Quantity</label>
          <input
            type="number"
            step="0.0001"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity) setErrors({ ...errors, quantity: '' });
            }}
            placeholder="0.0"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3 font-semibold rounded-lg transition text-white ${
            orderType === 'buy'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Review {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order
        </button>
      </form>

      {/* Info */}
      <div className="mt-8 p-4 bg-slate-700 rounded-lg text-slate-300 text-sm">
        <p className="mb-2">
          <strong>Available Cash:</strong> ${parseFloat(portfolio.current_cash).toFixed(2)}
        </p>
        <p>
          <strong>Note:</strong> You will be asked to confirm this order before execution.
        </p>
      </div>
    </div>
  );
}
