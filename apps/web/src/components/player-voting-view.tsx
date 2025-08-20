"use client";
import { useState } from "react";
import { TimerRing } from "./timer-ring";
import type { Choice } from "@party/types";

type PlayerVotingViewProps = {
  question: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  onSubmitVote: (choiceId: string) => void;
  hasVoted: boolean;
  selectedChoiceId?: string;
};

export function PlayerVotingView({ 
  question, 
  choices, 
  timeLeft, 
  totalTime, 
  round, 
  maxRounds,
  onSubmitVote,
  hasVoted,
  selectedChoiceId
}: PlayerVotingViewProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | undefined>(selectedChoiceId);

  const handleSubmitVote = () => {
    if (selectedChoice) {
      onSubmitVote(selectedChoice);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    if (!hasVoted) {
      setSelectedChoice(choiceId);
    }
  };

  const getSelectedChoice = () => {
    return choices.find(c => c.id === selectedChoice);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Round indicator */}
      <div className="mb-8">
        <div className="text-sm text-[--muted] mb-2">Round {round} of {maxRounds}</div>
        <div className="w-24 h-1 bg-[--panel] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[--accent] transition-all duration-300 ease-out"
            style={{ width: `${(round / maxRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer and Question */}
      <div className="flex flex-col items-center gap-8 mb-8">
        <TimerRing seconds={timeLeft} total={totalTime} />
        
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-[--text] leading-tight mb-4">
            {question}
          </h1>
          <p className="text-[--muted] text-lg">
            {hasVoted ? 'You have voted!' : 'Choose the correct answer:'}
          </p>
        </div>
      </div>

      {/* Choices */}
      <div className="w-full max-w-2xl">
        {!hasVoted ? (
          <div className="grid gap-4">
            {choices.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              const isTruth = choice.id.startsWith('TRUE::');
              
              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id)}
                  disabled={timeLeft <= 0}
                  className={`p-4 rounded-xl border-2 transition-all text-left w-full ${
                    'cursor-pointer hover:border-[--accent] hover:bg-[--accent]/5'
                  } ${
                    isSelected 
                      ? 'border-[--accent] bg-[--accent]/10' 
                      : 'border-[--border] bg-[--panel]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      isTruth 
                        ? 'bg-[--success] text-black font-semibold' 
                        : 'bg-[--muted] text-[--text]'
                    }`}>
                      {isTruth ? 'TRUTH' : 'BLUFF'}
                    </span>
                    <span className="text-lg font-medium">{choice.text}</span>
                    
                    {isSelected && (
                      <span className="ml-auto text-[--accent] text-2xl">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[--muted] mb-2">
                Your Vote
              </label>
              {getSelectedChoice() && (
                <div className="p-4 rounded-xl border-2 border-[--accent] bg-[--accent]/10">
                  <div className="flex items-center gap-3 justify-center">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      getSelectedChoice()?.id.startsWith('TRUE::')
                        ? 'bg-[--success] text-black font-semibold' 
                        : 'bg-[--muted] text-[--text]'
                    }`}>
                      {getSelectedChoice()?.id.startsWith('TRUE::') ? 'TRUTH' : 'BLUFF'}
                    </span>
                    <span className="text-lg font-medium">{getSelectedChoice()?.text}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-2xl font-semibold text-[--accent] mb-2">✅ Vote Submitted!</div>
            <div className="text-[--muted]">Waiting for other players...</div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!hasVoted && (
        <div className="mt-8">
          <button
            onClick={handleSubmitVote}
            disabled={!selectedChoice || timeLeft <= 0}
            className="h-12 px-8 rounded-xl bg-[--accent] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[--accent-hover] transition-colors"
          >
            Submit Vote
          </button>
        </div>
      )}

      {/* Time remaining info */}
      <div className="mt-8 text-[--muted] text-sm">
        Time remaining: {timeLeft} seconds
      </div>
    </div>
  );
}
