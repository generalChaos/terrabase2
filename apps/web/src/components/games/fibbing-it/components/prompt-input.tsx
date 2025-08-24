'use client';
import { useState } from 'react';

type PromptInputProps = {
  onSubmitAnswer: (answer: string) => void;
  hasSubmitted: boolean;
};

export function PromptInput({ onSubmitAnswer, hasSubmitted }: PromptInputProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmitAnswer = () => {
    if (answer.trim() && onSubmitAnswer) {
      onSubmitAnswer(answer.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer..."
        className="w-full px-4 py-3 text-lg bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
        disabled={hasSubmitted}
      />

      <button
        onClick={handleSubmitAnswer}
        disabled={!answer.trim() || hasSubmitted}
        className={`
          w-full px-6 py-3 rounded-xl font-bold text-lg transition-all duration-500 transform relative overflow-hidden
          ${hasSubmitted 
            ? 'cursor-not-allowed'
            : 'hover:scale-110 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1'
          }
        `}
      >
        {/* Simplified Button with Border Effect */}
        
        {/* Main Button Background */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${
          hasSubmitted 
            ? 'from-green-500 via-emerald-500 to-teal-600' 
            : 'from-teal-500 via-cyan-500 to-blue-600'
        }`} />
        
        {/* Border Effect using box-shadow */}
        <div className="absolute inset-0 rounded-xl" style={{
          boxShadow: `inset 0 0 0 4px ${hasSubmitted ? '#059669' : '#0d9488'}`
        }} />
        
        {/* Bright Highlight Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
        
        {/* Animated Shimmer Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
        
        {/* Content */}
        <span className="relative z-10 text-white font-bold text-xl drop-shadow-2xl tracking-wide">
          {hasSubmitted ? 'Submitted!' : 'Submit Answer'}
        </span>
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </button>
    </div>
  );
}
