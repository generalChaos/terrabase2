'use client';
import { typography } from '../../../../shared/ui';

type QuestionDisplayProps = {
  question: string;
};

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: '600ms' }}>
      {/* Question Container */}
      <div className="relative p-8">
        <h2 className="font-bold text-white leading-tight tracking-wide text-4xl">
          {question}
        </h2>
      </div>
    </div>
  );
}
