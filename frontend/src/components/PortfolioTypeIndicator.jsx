import { Bot, User } from 'lucide-react';

export default function PortfolioTypeIndicator({ modelName }) {
  if (modelName) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl backdrop-blur-sm">
        <Bot className="text-purple-400" size={14} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-200 uppercase tracking-wide">Model</span>
          <div className="h-3 w-px bg-purple-500/50"></div>
          <span className="text-xs font-semibold text-purple-300">{modelName}</span>
        </div>
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
      <User className="text-blue-400" size={14} />
      <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">Manual</span>
    </div>
  );
}
