import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'from-green-600/20 to-emerald-600/20',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-400',
      textColor: 'text-green-200',
    },
    error: {
      icon: XCircle,
      bgColor: 'from-red-600/20 to-rose-600/20',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
      textColor: 'text-red-200',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'from-yellow-600/20 to-orange-600/20',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-200',
    },
    info: {
      icon: Info,
      bgColor: 'from-blue-600/20 to-cyan-600/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-200',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div className={`fixed bottom-8 right-8 z-50 animate-fadeIn`}>
      <div className={`glass bg-gradient-to-r ${bgColor} border ${borderColor} rounded-xl p-4 shadow-2xl max-w-md backdrop-blur-md`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon size={20} />
          </div>
          <p className={`flex-1 text-sm font-medium ${textColor} leading-relaxed`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
