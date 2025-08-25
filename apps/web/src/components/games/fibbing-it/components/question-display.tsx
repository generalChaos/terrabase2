'use client';
import { typography } from '@party/ui';

type QuestionDisplayProps = {
  question: string;
};

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: '600ms' }}>
      {/* Question Container */}
      <div className="relative p-8">
        <h2 className="font-bold text-white leading-tight tracking-wide" style={{
          fontSize: typography.fontSize['4xl'][0],
          lineHeight: typography.fontSize['4xl'][1].lineHeight
        }}>
          {question}
        </h2>
      </div>
    </div>
  );
}
