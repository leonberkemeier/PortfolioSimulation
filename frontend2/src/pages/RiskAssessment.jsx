import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Clock, DollarSign, Brain, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import api from '../services/api';
import '../styles/RiskAssessment.css';

// ── Profile definitions — must match deploy_on_ai-pc RISK_PROFILES ──────────
const PROFILES = {
  1: {
    name: 'Conservative',
    tagline: 'Capital preservation above all',
    description:
      'You prioritise protecting your money over growing it. Your portfolio uses the tightest ' +
      'risk controls, focusing on low-volatility assets and bonds. The AI system will assign you ' +
      'a portfolio with a maximum 2% Value-at-Risk (VaR) and at least 15 diversified positions.',
    color: '#3b82f6',
    icon: Shield,
    maxVaR: '2%',
    minAssets: 15,
  },
  2: {
    name: 'Moderately Conservative',
    tagline: 'Safety-first with modest growth',
    description:
      'You want a cushion against losses but still seek some growth. Your portfolio has strong ' +
      'downside protection with limited exposure to volatile assets. The AI targets a maximum 4% ' +
      'VaR across at least 12 positions.',
    color: '#8b5cf6',
    icon: Shield,
    maxVaR: '4%',
    minAssets: 12,
  },
  3: {
    name: 'Moderate',
    tagline: 'Balanced growth and stability',
    description:
      'You seek a balance between growing your money and managing risk. Your portfolio blends ' +
      'equities and lower-volatility assets for steady, diversified returns. The AI targets a ' +
      'maximum 6% VaR across at least 10 positions.',
    color: '#f59e0b',
    icon: TrendingUp,
    maxVaR: '6%',
    minAssets: 10,
  },
  4: {
    name: 'Moderately Aggressive',
    tagline: 'Growth-oriented, calculated risk',
    description:
      'You accept higher volatility in pursuit of strong long-term returns. Your portfolio is ' +
      'equity-heavy with limited defensive positions. The AI targets a maximum 10% VaR across ' +
      'at least 10 positions.',
    color: '#ef4444',
    icon: TrendingUp,
    maxVaR: '10%',
    minAssets: 10,
  },
  5: {
    name: 'Aggressive',
    tagline: 'Maximum growth potential',
    description:
      'You are comfortable with significant swings in pursuit of maximum long-term gains. Your ' +
      'portfolio is concentrated in high-conviction, high-growth assets. The AI targets a maximum ' +
      '15% VaR across at least 10 positions.',
    color: '#f97316',
    icon: AlertTriangle,
    maxVaR: '15%',
    minAssets: 10,
  },
};

// ── Questions ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    icon: Clock,
    title: 'Investment Horizon',
    question: 'When do you plan to start drawing on this investment?',
    answers: [
      { label: 'Less than 1 year',  score: 1 },
      { label: '1 – 3 years',       score: 2 },
      { label: '3 – 7 years',       score: 3 },
      { label: '7 – 15 years',      score: 4 },
      { label: '15+ years',         score: 5 },
    ],
  },
  {
    id: 2,
    icon: TrendingUp,
    title: 'Market Reaction',
    question: 'Your portfolio drops 20% in a market downturn. What do you do?',
    answers: [
      { label: 'Sell everything to prevent further loss',      score: 1 },
      { label: 'Sell some positions to reduce exposure',       score: 2 },
      { label: 'Hold and wait for it to recover',             score: 3 },
      { label: 'Buy a little more at the lower prices',       score: 4 },
      { label: 'Buy aggressively — this is a great opportunity', score: 5 },
    ],
  },
  {
    id: 3,
    icon: Brain,
    title: 'Investment Goal',
    question: 'What is your primary goal for this investment?',
    answers: [
      { label: 'Preserve my capital — safety first',         score: 1 },
      { label: 'Generate steady regular income',             score: 2 },
      { label: 'Balanced growth and income',                 score: 3 },
      { label: 'Grow capital significantly over time',       score: 4 },
      { label: 'Maximum long-term growth, whatever it takes', score: 5 },
    ],
  },
  {
    id: 4,
    icon: DollarSign,
    title: 'Income Stability',
    question: 'How would you describe your income and financial situation?',
    answers: [
      { label: 'Very unstable — irregular income',            score: 1 },
      { label: 'Somewhat unstable — some uncertainty',        score: 2 },
      { label: 'Mostly stable and predictable',              score: 3 },
      { label: 'Very stable — secure employment',            score: 4 },
      { label: 'Multiple strong, reliable income sources',   score: 5 },
    ],
  },
  {
    id: 5,
    icon: Brain,
    title: 'Investment Experience',
    question: 'How experienced are you with investing?',
    answers: [
      { label: 'No experience at all',                            score: 1 },
      { label: 'Only savings accounts or term deposits',          score: 2 },
      { label: 'Some ETFs or managed funds',                      score: 3 },
      { label: 'Individual stocks and bonds',                     score: 4 },
      { label: 'Derivatives, options, or alternative assets',     score: 5 },
    ],
  },
  {
    id: 6,
    icon: AlertTriangle,
    title: 'Loss Tolerance',
    question: 'What is the maximum annual loss you could emotionally accept?',
    answers: [
      { label: 'Up to 2%  — almost no loss',    score: 1 },
      { label: 'Up to 10% — small losses only', score: 2 },
      { label: 'Up to 20% — moderate losses',   score: 3 },
      { label: 'Up to 35% — significant losses', score: 4 },
      { label: '35%+  — losses are part of the game', score: 5 },
    ],
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────
function calculateProfile(answers) {
  const values = Object.values(answers);
  if (values.length === 0) return null;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.min(5, Math.max(1, Math.round(avg)));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RiskAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);          // 0 = intro, 1-6 = questions, 7 = result
  const [answers, setAnswers] = useState({});   // { questionId: score }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = QUESTIONS.length;
  const currentQ = QUESTIONS[step - 1];
  const profileId = calculateProfile(answers);
  const profile = profileId ? PROFILES[profileId] : null;

  const handleAnswer = (score) => {
    const newAnswers = { ...answers, [currentQ.id]: score };
    setAnswers(newAnswers);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setStep(totalSteps + 1); // go to results
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else setStep(0);
  };

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/risk-profile', { profile_id: profileId });
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="ra-container">
        <div className="ra-card ra-intro">
          <div className="ra-intro-icon">
            <Shield size={48} />
          </div>
          <h1>Risk Profile Assessment</h1>
          <p className="ra-intro-sub">
            Answer 6 short questions to determine your investment risk profile.
            This determines which AI-managed model portfolio you'll be assigned to.
          </p>
          <div className="ra-profiles-preview">
            {Object.values(PROFILES).map((p) => (
              <div key={p.name} className="ra-profile-chip" style={{ borderColor: p.color }}>
                <span style={{ color: p.color }}>{p.name}</span>
              </div>
            ))}
          </div>
          <button className="ra-btn-primary" onClick={() => setStep(1)}>
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (step === totalSteps + 1 && profile) {
    const ProfileIcon = profile.icon;
    return (
      <div className="ra-container">
        <div className="ra-card ra-result">
          <div className="ra-result-header" style={{ borderColor: profile.color }}>
            <div className="ra-result-icon" style={{ color: profile.color }}>
              <ProfileIcon size={40} />
            </div>
            <div className="ra-result-badge" style={{ background: profile.color }}>
              Profile {profileId} of 5
            </div>
          </div>

          <h2 className="ra-result-name" style={{ color: profile.color }}>
            {profile.name}
          </h2>
          <p className="ra-result-tagline">{profile.tagline}</p>
          <p className="ra-result-desc">{profile.description}</p>

          <div className="ra-result-stats">
            <div className="ra-stat">
              <span className="ra-stat-label">Max Portfolio VaR</span>
              <span className="ra-stat-value" style={{ color: profile.color }}>{profile.maxVaR}</span>
            </div>
            <div className="ra-stat">
              <span className="ra-stat-label">Min. Diversification</span>
              <span className="ra-stat-value" style={{ color: profile.color }}>{profile.minAssets} assets</span>
            </div>
          </div>

          {error && <p className="ra-error">{error}</p>}

          {saved ? (
            <div className="ra-saved">
              <CheckCircle size={20} />
              <span>Saved! Redirecting to dashboard…</span>
            </div>
          ) : (
            <div className="ra-result-actions">
              <button className="ra-btn-secondary" onClick={() => { setStep(0); setAnswers({}); }}>
                Retake
              </button>
              <button
                className="ra-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save My Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  const QIcon = currentQ.icon;
  const progress = ((step - 1) / totalSteps) * 100;
  const selected = answers[currentQ.id];

  return (
    <div className="ra-container">
      <div className="ra-card">
        {/* Progress */}
        <div className="ra-progress-bar-bg">
          <div className="ra-progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="ra-step-counter">Question {step} of {totalSteps}</p>

        {/* Question */}
        <div className="ra-question-icon">
          <QIcon size={28} />
        </div>
        <p className="ra-question-category">{currentQ.title}</p>
        <h2 className="ra-question-text">{currentQ.question}</h2>

        {/* Answers */}
        <div className="ra-answers">
          {currentQ.answers.map((answer) => (
            <button
              key={answer.score}
              className={`ra-answer-btn ${selected === answer.score ? 'selected' : ''}`}
              onClick={() => handleAnswer(answer.score)}
            >
              <span className="ra-answer-score">{answer.score}</span>
              <span className="ra-answer-label">{answer.label}</span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="ra-nav">
          <button className="ra-btn-ghost" onClick={handleBack}>
            <ChevronLeft size={16} />
            Back
          </button>
          {selected && step < totalSteps && (
            <button className="ra-btn-ghost" onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight size={16} />
            </button>
          )}
          {selected && step === totalSteps && (
            <button className="ra-btn-primary" onClick={() => setStep(totalSteps + 1)}>
              See My Profile
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
