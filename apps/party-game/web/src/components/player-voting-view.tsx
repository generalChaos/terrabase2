"use client";
import { useState } from "react";
import { buttonVariants } from "../shared/ui";

type Choice = {
  id: string;
  text: string;
  by: string;
};

type PlayerVotingViewProps = {
  question: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  onSubmitVote?: (choiceId: string) => void;
  hasVoted?: boolean;
  selectedChoiceId?: string;
  gotAnswerCorrect?: boolean;
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
  selectedChoiceId,
  gotAnswerCorrect = false,
}: PlayerVotingViewProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | undefined>(
    selectedChoiceId
  );

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  const handleSubmitVote = () => {
    if (selectedChoice && onSubmitVote) {
      onSubmitVote(selectedChoice);
    }
  };

  const progressPercentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-fade-in">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800/50 p-4 animate-slide-down">
        <div className="max-w-md mx-auto">
          <div className="text-center text-sm text-[--muted] mb-2">
            Round {round} of {maxRounds}
          </div>
          <div className="w-24 h-1 bg-[--panel] rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-[--accent] transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center gap-8 mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-[--text] leading-tight mb-4 text-center">
            {question}
          </h1>
        </div>

        {gotAnswerCorrect ? (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="text-2xl font-semibold text-[--success] mb-2">
              🎯 You&apos;re Done!
            </div>
            <div className="text-[--muted] text-lg">
              You already know the answer, so you can just watch and see how
              many people you fooled!
            </div>
          </div>
        ) : !hasVoted ? (
          <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="text-center">
              <div className="text-2xl font-semibold text-[--success] mb-2">
                🗳️ Time to Vote!
              </div>
              <div className="text-[--muted] text-lg">
                Choose which answer you think is the truth
              </div>
            </div>

            <div className="grid gap-4 mt-8">
              {choices.map((choice, index) => {
                const isSelected = selectedChoice === choice.id;
                const isTruth = choice.id.startsWith("TRUE::");

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    disabled={timeLeft <= 0}
                    className={`p-4 rounded-xl border-2 transition-all text-left w-full animate-fade-in-up`}
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          isTruth
                            ? "bg-[--success] text-black font-semibold"
                            : "border-[--border] bg-[--panel]"
                        }`}
                      >
                        {isTruth ? "TRUTH" : "BLUFF"}
                      </span>
                      <span className="text-lg font-medium">{choice.text}</span>

                      {isSelected && (
                        <span className="ml-auto text-[--accent] text-2xl animate-bounce-in">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedChoice && (
              <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[--muted] mb-2">
                    Your Selection:
                  </label>
                  <div className="p-4 rounded-xl border-2 border-[--accent] bg-[--accent]/10">
                    <div className="flex items-center gap-3 justify-center">
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          selectedChoice.startsWith("TRUE::")
                            ? "bg-[--success] text-black font-semibold"
                            : "bg-[--muted] text-[--text]"
                        }`}
                      >
                        {selectedChoice.startsWith("TRUE::") ? "TRUTH" : "BLUFF"}
                      </span>
                      <span className="text-lg font-medium">
                        {choices.find((c) => c.id === selectedChoice)?.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-2xl font-semibold text-[--accent] mb-2">
                  Ready to Submit?
                </div>
                <div className="text-[--muted]">Waiting for other players...</div>

                <div className="mt-8">
                  <button
                    onClick={handleSubmitVote}
                    disabled={timeLeft <= 0}
                    className={buttonVariants({
                      variant: "accent",
                      size: "xl",
                      fullWidth: true,
                      animation: "glow"
                    })}
                  >
                    Submit Vote
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="text-2xl font-semibold text-[--accent] mb-2">
              ✅ Vote Submitted!
            </div>
            <div className="text-[--muted]">Waiting for other players...</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[--muted] text-sm animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
        <p>Time remaining: {Math.ceil(timeLeft / 1000)}s</p>
      </div>
    </div>
  );
}
