import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { portfolios } from '../../services/api';
import ErrorMessage from '../ErrorMessage';

const STEP_BASIC = 1;
const STEP_RISK = 2;
const STEP_FEE = 3;
const STEP_CONFIRMATION = 4;
const STEP_SUCCESS = 5;

export default function PortfolioCreationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_BASIC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPortfolioId, setNewPortfolioId] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    description: '',
    initial_capital: '',
    // Step 2
    max_position_size: '10',
    max_cash_per_trade: '',
    max_allocation_per_asset_class: '25',
    // Step 3
    fee_structure_id: null,
  });

  const [errors, setErrors] = useState({});

  // Step 1: Validate basic info
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Portfolio name must be 255 characters or less';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    if (!formData.initial_capital) {
      newErrors.initial_capital = 'Initial capital is required';
    } else {
      const capital = parseFloat(formData.initial_capital);
      if (isNaN(capital) || capital <= 0) {
        newErrors.initial_capital = 'Initial capital must be a positive number';
      }
    }
    return newErrors;
  };

  // Step 2: Validate risk settings
  const validateStep2 = () => {
    const newErrors = {};
    const maxPos = parseFloat(formData.max_position_size);
    const maxAlloc = parseFloat(formData.max_allocation_per_asset_class);

    if (formData.max_position_size && (isNaN(maxPos) || maxPos < 0 || maxPos > 100)) {
      newErrors.max_position_size = 'Must be between 0 and 100';
    }
    if (formData.max_cash_per_trade) {
      const maxCash = parseFloat(formData.max_cash_per_trade);
      if (isNaN(maxCash) || maxCash <= 0) {
        newErrors.max_cash_per_trade = 'Must be a positive number';
      }
    }
    if (formData.max_allocation_per_asset_class && (isNaN(maxAlloc) || maxAlloc < 0 || maxAlloc > 100)) {
      newErrors.max_allocation_per_asset_class = 'Must be between 0 and 100';
    }
    return newErrors;
  };

  const handleNext = () => {
    setError(null);
    let stepErrors = {};

    if (step === STEP_BASIC) {
      stepErrors = validateStep1();
    } else if (step === STEP_RISK) {
      stepErrors = validateStep2();
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setErrors({});
    setStep(step - 1);
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        initial_capital: parseFloat(formData.initial_capital),
        max_position_size: formData.max_position_size ? parseFloat(formData.max_position_size) : undefined,
        max_cash_per_trade: formData.max_cash_per_trade ? parseFloat(formData.max_cash_per_trade) : undefined,
        max_allocation_per_asset_class: formData.max_allocation_per_asset_class
          ? parseFloat(formData.max_allocation_per_asset_class)
          : undefined,
        fee_structure_id: formData.fee_structure_id || undefined,
      };

      const res = await portfolios.create(payload);
      setNewPortfolioId(res.data.id);
      setStep(STEP_SUCCESS);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create portfolio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Progress indicator
  const progressSteps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Risk Settings' },
    { num: 3, label: 'Fee Structure' },
    { num: 4, label: 'Confirm' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Create New Portfolio</h1>
        <p className="text-slate-400">Set up a new manual trading portfolio</p>
      </div>

      {/* Content */}
      <div className="p-8 max-w-3xl mx-auto">
        {/* Progress Indicator */}
        {step !== STEP_SUCCESS && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              {progressSteps.map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                      step >= s.num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {s.num}
                  </div>
                  <p className={`ml-3 font-semibold ${
                    step >= s.num ? 'text-white' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </p>
                  {idx < progressSteps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ml-6 transition ${
                        step > s.num ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === STEP_BASIC && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Portfolio Basics</h2>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Portfolio Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., My Trading Portfolio"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Optional: Describe your trading strategy..."
                rows="4"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Initial Capital ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_capital}
                onChange={(e) => handleFieldChange('initial_capital', e.target.value)}
                placeholder="e.g., 10000"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.initial_capital && <p className="text-red-400 text-sm mt-1">{errors.initial_capital}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Risk Settings */}
        {step === STEP_RISK && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Risk Management Settings</h2>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Max Position Size (% of portfolio)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.max_position_size}
                onChange={(e) => handleFieldChange('max_position_size', e.target.value)}
                placeholder="10"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-slate-400 text-sm mt-2">Limits the maximum % of portfolio value in a single holding</p>
              {errors.max_position_size && <p className="text-red-400 text-sm mt-1">{errors.max_position_size}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Max Cash Per Trade ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.max_cash_per_trade}
                onChange={(e) => handleFieldChange('max_cash_per_trade', e.target.value)}
                placeholder="Leave empty for no limit"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-slate-400 text-sm mt-2">Maximum cash to deploy per single trade</p>
              {errors.max_cash_per_trade && <p className="text-red-400 text-sm mt-1">{errors.max_cash_per_trade}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">Max Allocation Per Asset Class (% of portfolio)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.max_allocation_per_asset_class}
                onChange={(e) => handleFieldChange('max_allocation_per_asset_class', e.target.value)}
                placeholder="25"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-slate-400 text-sm mt-2">Max % that can be allocated to one asset class (stocks/crypto/bonds/commodities)</p>
              {errors.max_allocation_per_asset_class && <p className="text-red-400 text-sm mt-1">{errors.max_allocation_per_asset_class}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Fee Structure */}
        {step === STEP_FEE && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Fee Structure</h2>
            <p className="text-slate-400">Select a fee structure or leave empty for zero fees</p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition">
                <input
                  type="radio"
                  name="feeStructure"
                  checked={formData.fee_structure_id === null}
                  onChange={() => handleFieldChange('fee_structure_id', null)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="text-white font-semibold">No Fees</p>
                  <p className="text-slate-400 text-sm">Trade commission-free</p>
                </div>
              </label>

              <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-sm">
                  Additional fee structures can be configured. For now, you can select "No Fees" or leave for later configuration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === STEP_CONFIRMATION && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Confirm Portfolio Details</h2>

            <div className="bg-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-2 border-blue-500 pl-4">
                  <p className="text-slate-400 text-sm">Portfolio Name</p>
                  <p className="text-lg font-bold text-white mt-1">{formData.name}</p>
                </div>
                <div className="border-l-2 border-blue-500 pl-4">
                  <p className="text-slate-400 text-sm">Initial Capital</p>
                  <p className="text-lg font-bold text-white mt-1">${parseFloat(formData.initial_capital).toFixed(2)}</p>
                </div>
              </div>

              {formData.description && (
                <div className="border-l-2 border-blue-500 pl-4 pt-4">
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white mt-1">{formData.description}</p>
                </div>
              )}

              <div className="border-t border-slate-600 pt-4 mt-4">
                <h4 className="text-slate-300 font-semibold mb-3">Risk Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Max Position Size</p>
                    <p className="text-white font-semibold">{formData.max_position_size}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Max Cash Per Trade</p>
                    <p className="text-white font-semibold">
                      {formData.max_cash_per_trade ? `$${parseFloat(formData.max_cash_per_trade).toFixed(2)}` : 'No limit'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-sm">Max Allocation Per Asset Class</p>
                    <p className="text-white font-semibold">{formData.max_allocation_per_asset_class}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <p className="text-green-200 text-sm">
                ✓ Review the details above and click "Create Portfolio" to proceed. You can start trading immediately after creation.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === STEP_SUCCESS && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center space-y-6">
            <CheckCircle size={64} className="text-green-400 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Portfolio Created!</h2>

            <div className="bg-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-2">Portfolio ID</p>
              <p className="text-2xl font-bold text-white">{newPortfolioId}</p>
            </div>

            <p className="text-slate-300">
              Your portfolio "{formData.name}" has been successfully created with an initial capital of ${parseFloat(formData.initial_capital).toFixed(2)}.
            </p>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => navigate(`/portfolio/${newPortfolioId}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                View Portfolio
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 font-semibold rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step !== STEP_SUCCESS && (
          <div className="flex gap-4 mt-8">
            {step > STEP_BASIC && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}

            {step < STEP_CONFIRMATION && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={20} />
              </button>
            )}

            {step === STEP_CONFIRMATION && (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="ml-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Portfolio'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
