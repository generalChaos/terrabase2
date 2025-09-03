'use client';
import { PromptInput } from '../components/prompt-input';

type PromptPhaseViewProps = {
  onSubmitAnswer: (answer: string) => void;
  hasSubmitted: boolean;
};

export function PromptPhaseView({ onSubmitAnswer, hasSubmitted }: PromptPhaseViewProps) {
  return (
    <PromptInput
      onSubmitAnswer={onSubmitAnswer}
      hasSubmitted={hasSubmitted}
    />
  );
}
