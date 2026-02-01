import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Bot, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { portfolios } from '../services/api';
import '../styles/PortfolioCreation.css';

const MODELS = [
  {
    id: 'momentum',
    name: 'Momentum Strategy',
    description: 'Follows trending stocks with strong price momentum',
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Buys oversold stocks expecting price recovery',
  },
  {
    id: 'value',
    name: 'Value Investing',
    description: 'Focuses on undervalued stocks with strong fundamentals',
  },
];

export default function PortfolioCreationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [portfolioData, setPortfolioData] = useState({
    name: '',
    description: '',
    initialCapital: '10000',
    type: null, // 'manual' or 'model'
    modelName: null,
  });
  const [createdPortfolio, setCreatedPortfolio] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setPortfolioData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = (type) => {
    setPortfolioData(prev => ({ ...prev, type, modelName: null }));
  };

  const handleModelSelect = (modelId) => {
    setPortfolioData(prev => ({ ...prev, modelName: modelId }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return portfolioData.type !== null;
      case 2:
        if (portfolioData.type === 'model') {
          return portfolioData.modelName !== null;
        }
        return true;
      case 3:
        return portfolioData.name.trim() !== '' && portfolioData.initialCapital > 0;
      case 4:
        // Review step - can always proceed if we got here
        return portfolioData.name.trim() !== '' && portfolioData.initialCapital > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      // Skip step 2 for manual portfolios (go directly to step 3)
      if (currentStep === 1 && portfolioData.type === 'manual') {
        setCurrentStep(3);
      } else if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // If going back from step 3 and it's a manual portfolio, skip step 2
      if (currentStep === 3 && portfolioData.type === 'manual') {
        setCurrentStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: portfolioData.name,
        description: portfolioData.description || undefined,
        initial_capital: parseFloat(portfolioData.initialCapital),
        model_name: portfolioData.type === 'model' ? portfolioData.modelName : undefined,
      };

      const response = await portfolios.create(payload);
      setCreatedPortfolio(response.data);
      setCurrentStep(5);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      setError(err.response?.data?.detail || 'Failed to create portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return '';
  };

  return (
    <div className="portfolio-wizard">
      <div className="wizard-header">
        <h1>Create New Portfolio</h1>
        <p>Follow the steps below to set up your trading portfolio</p>
      </div>

      {/* Progress Bar */}
      <div className="wizard-progress">
        <div className={`progress-step ${getStepStatus(1)}`}>
          <div className="step-circle">1</div>
          <span className="step-label">Type</span>
        </div>
        <div className={`progress-step ${getStepStatus(2)}`}>
          <div className="step-circle">2</div>
          <span className="step-label">Model</span>
        </div>
        <div className={`progress-step ${getStepStatus(3)}`}>
          <div className="step-circle">3</div>
          <span className="step-label">Details</span>
        </div>
        <div className={`progress-step ${getStepStatus(4)}`}>
          <div className="step-circle">4</div>
          <span className="step-label">Review</span>
        </div>
      </div>

      {/* Step 1: Portfolio Type */}
      {currentStep === 1 && (
        <div className="wizard-card">
          <h2>Choose Portfolio Type</h2>
          <p>Select how you want to manage your portfolio</p>

          <div className="portfolio-type-grid">
            <div
              className={`type-card ${portfolioData.type === 'manual' ? 'selected' : ''}`}
              onClick={() => handleTypeSelect('manual')}
            >
              <div className="type-icon">
                <Briefcase size={40} color="white" />
              </div>
              <h3>Manual Trading</h3>
              <p>Full control over your trading decisions. Execute trades manually based on your own strategy.</p>
            </div>

            <div
              className={`type-card ${portfolioData.type === 'model' ? 'selected' : ''}`}
              onClick={() => handleTypeSelect('model')}
            >
              <div className="type-icon">
                <Bot size={40} color="white" />
              </div>
              <h3>Model-Driven</h3>
              <p>Let AI models analyze markets and suggest trades based on proven strategies.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Model Selection (if model-driven) */}
      {currentStep === 2 && portfolioData.type === 'model' && (
        <div className="wizard-card">
          <h2>Select Trading Model</h2>
          <p>Choose a trading strategy for your portfolio</p>

          <div className="model-selection-grid">
            {MODELS.map((model) => (
              <div
                key={model.id}
                className={`model-card ${portfolioData.modelName === model.id ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model.id)}
              >
                <div className="model-header">
                  <div className="model-badge">AI Model</div>
                </div>
                <h3>{model.name}</h3>
                <p>{model.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Portfolio Details */}
      {currentStep === 3 && (
        <div className="wizard-card">
          <h2>Portfolio Details</h2>
          <p>Provide basic information about your portfolio</p>

          <div className="form-group">
            <label>Portfolio Name *</label>
            <input
              type="text"
              value={portfolioData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Growth Portfolio"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={portfolioData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="form-group">
            <label>Initial Capital *</label>
            <input
              type="number"
              value={portfolioData.initialCapital}
              onChange={(e) => handleInputChange('initialCapital', e.target.value)}
              placeholder="10000"
              min="100"
              step="100"
              required
            />
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <div className="wizard-card">
          <h2>Review & Confirm</h2>
          <p>Please review your portfolio configuration</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Portfolio Name</span>
              <span className="summary-value">{portfolioData.name}</span>
            </div>

            {portfolioData.description && (
              <div className="summary-item">
                <span className="summary-label">Description</span>
                <span className="summary-value">{portfolioData.description}</span>
              </div>
            )}

            <div className="summary-item">
              <span className="summary-label">Type</span>
              <span className="summary-value">
                {portfolioData.type === 'model' ? 'Model-Driven' : 'Manual Trading'}
              </span>
            </div>

            {portfolioData.type === 'model' && (
              <div className="summary-item">
                <span className="summary-label">Trading Model</span>
                <span className="summary-value">
                  {MODELS.find(m => m.id === portfolioData.modelName)?.name}
                </span>
              </div>
            )}

            <div className="summary-item">
              <span className="summary-label">Initial Capital</span>
              <span className="summary-value">
                {formatCurrency(parseFloat(portfolioData.initialCapital))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {currentStep === 5 && createdPortfolio && (
        <div className="wizard-card">
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle size={60} color="#10b981" />
            </div>
            <h2>Portfolio Created Successfully!</h2>
            <p>Your portfolio "{createdPortfolio.name}" is ready to use.</p>
            
            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/portfolio/${createdPortfolio.id}`)}
              >
                View Portfolio
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="wizard-actions">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {currentStep === 4 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? 'Creating...' : 'Create Portfolio'}
              <CheckCircle size={20} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
