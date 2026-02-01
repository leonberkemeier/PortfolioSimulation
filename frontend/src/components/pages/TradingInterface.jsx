import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { portfolios, orders } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import OrderForm from '../trading/OrderForm';
import OrderConfirmation from '../trading/OrderConfirmation';
import OrderSuccess from '../trading/OrderSuccess';

const STEP_FORM = 'form';
const STEP_CONFIRMATION = 'confirmation';
const STEP_SUCCESS = 'success';

export default function TradingInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(STEP_FORM);
  const [formData, setFormData] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await portfolios.get(parseInt(id));
      setPortfolio(res.data);

      // Guard: block if model-managed
      if (res.data.model_name) {
        setError('This is a model-managed portfolio. Trading is not allowed.');
      }
    } catch (err) {
      setError('Failed to load portfolio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (data) => {
    setFormData(data);
    setStep(STEP_CONFIRMATION);
  };

  const handleConfirmOrder = async () => {
    if (!formData) return;

    try {
      setSubmitting(true);
      setError(null);

      // Prepare order data
      const orderData = {
        ticker: formData.ticker,
        asset_type: formData.assetType,
        quantity: parseFloat(formData.quantity),
      };

      // Call appropriate endpoint
      let result;
      if (formData.orderType === 'buy') {
        result = await orders.buy(parseInt(id), orderData);
      } else {
        result = await orders.sell(parseInt(id), orderData);
      }

      setOrderResult({
        ...formData,
        ...result.data,
        executedAt: new Date().toISOString(),
      });
      setStep(STEP_SUCCESS);
    } catch (err) {
      setError(err.response?.data?.message || 'Order execution failed. Please check portfolio balance and holdings.');
      console.error(err);
      setStep(STEP_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setStep(STEP_FORM);
    setFormData(null);
    setError(null);
  };

  const handleBackToDashboard = () => {
    navigate(`/portfolio/${id}`);
  };

  if (loading) return <LoadingSpinner />;

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} />
          Back to Portfolios
        </Link>
        <ErrorMessage message={error || 'Portfolio not found'} />
      </div>
    );
  }

  // Block access if model-managed
  if (portfolio.model_name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <Link to={`/portfolio/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>
        <div className="max-w-md">
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 flex gap-4">
            <AlertCircle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h2 className="text-yellow-200 font-semibold mb-2">Model-Managed Portfolio</h2>
              <p className="text-yellow-100 text-sm">
                This portfolio is managed by the "{portfolio.model_name}" model and cannot be manually traded.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-8">
        <Link to={`/portfolio/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>
        <h1 className="text-4xl font-bold text-white">Place Trade</h1>
        <p className="text-slate-400 mt-2">{portfolio.name}</p>
      </div>

      {/* Portfolio Info Bar */}
      <div className="bg-slate-800 border-b border-slate-700 p-6 grid grid-cols-3 gap-6">
        <div>
          <p className="text-slate-400 text-sm">Available Cash</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${parseFloat(portfolio.current_cash).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">NAV</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${parseFloat(portfolio.nav).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Deployed</p>
          <p className="text-2xl font-bold text-white mt-1">
            {portfolio.deployed_pct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-8">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Content */}
      <div className="p-8 max-w-2xl mx-auto">
        {step === STEP_FORM && (
          <OrderForm 
            portfolio={portfolio}
            onSubmit={handleFormSubmit}
          />
        )}

        {step === STEP_CONFIRMATION && formData && (
          <OrderConfirmation
            formData={formData}
            portfolio={portfolio}
            onConfirm={handleConfirmOrder}
            onCancel={handleBackToForm}
            loading={submitting}
          />
        )}

        {step === STEP_SUCCESS && orderResult && (
          <OrderSuccess
            orderResult={orderResult}
            portfolio={portfolio}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
}
