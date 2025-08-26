'use client';
import { QuestionMarkAvatar } from '../../shared/ui';
import { DEFAULT_COLORS, getBorderColor, gameStyles, animationDelays } from '../shared';
import type { Option } from '../shared';

type VotingOptionsProps = {
  options: Option[];
  onSubmitVote: (choiceId: string) => void;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function VotingOptions({ options, onSubmitVote, selectedChoiceId, showOptions }: VotingOptionsProps) {
  const handleVote = (choiceId: string) => {
    onSubmitVote(choiceId);
  };

  return (
    <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slowest }}>
      {options.map((option, index) => (
        <button
          key={option.id}
          onClick={() => handleVote(option.id)}
          className={`
            w-full p-4 text-left rounded-xl transition-all duration-500 transform
            hover:scale-110 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1
            ${showOptions 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
            }
            relative overflow-hidden group
          `}
          style={{ 
            animationDelay: animationDelays.list(index),
            transitionDelay: `${index * 100}ms`
          }}
        >
          {/* Background with Border Effect */}
          <div className={`${gameStyles.card.option} ${option.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}`} />
          <div 
            className={gameStyles.card.optionBorder}
            style={{ boxShadow: `inset 0 0 0 4px ${getBorderColor(option.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length])}` }}
          />
          
          {/* Highlight and Shimmer */}
          <div className={gameStyles.card.optionHighlight} />
          <div className={gameStyles.card.optionShimmer} />
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Left: Question Mark Avatar */}
            <div className="flex-shrink-0">
              <QuestionMarkAvatar size="xl" />
            </div>
            
            {/* Center: Answer Text */}
            <div className="flex-1">
              <span className={gameStyles.text.headingMedium}>{option.text}</span>
            </div>
            
            {/* Right: Checkmark */}
            {selectedChoiceId === option.id && (
              <span className={`text-white font-bold text-2xl ${gameStyles.animation.bounce} flex-shrink-0`}>
                ✓
              </span>
            )}
          </div>
          
          {/* Selected State */}
          {selectedChoiceId === option.id && (
            <div className="absolute inset-0 rounded-xl bg-white/50 animate-slide-in" />
          )}
        </button>
      ))}
    </div>
  );
}
