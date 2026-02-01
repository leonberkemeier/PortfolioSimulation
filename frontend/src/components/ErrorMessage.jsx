import { AlertCircle, XCircle } from 'lucide-react';

export default function ErrorMessage({ message }) {
  return (
    <div className="glass border-red-500/50 rounded-xl p-6 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="text-red-400" size={24} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-red-300 text-lg">Error Occurred</h3>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-red-200/80 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
