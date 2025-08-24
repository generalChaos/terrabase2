'use client';
import { typography } from '@party/ui';

type QuestionDisplayProps = {
  question: string;
};

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: '600ms' }}>
      {/* Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 blur-3xl rounded-3xl transform scale-110"></div>
      
      {/* Question Container */}
      <div className="relative bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-3xl p-8 shadow-2xl">
        <h2 className="font-bold bg-gradient-to-r from-white via-slate-100 via-slate-200 to-slate-300 bg-clip-text text-transparent leading-tight tracking-wide drop-shadow-lg" style={{
          fontSize: typography.fontSize['4xl'][0],
          lineHeight: typography.fontSize['4xl'][1].lineHeight
        }}>
          {question}
        </h2>
      </div>
      
      {/* Additional Glow Effects */}
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/30 via-cyan-400/30 to-blue-400/30 rounded-3xl blur-xl opacity-75 animate-pulse-slow"></div>
    </div>
  );
}
