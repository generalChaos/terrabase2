'use client';
import { QuestionMarkAvatar } from '../../shared/ui';

type Option = {
  id: string;
  text: string;
  color: string;
};

type VotingOptionsProps = {
  options: Option[];
  onSubmitVote: (choiceId: string) => void;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function VotingOptions({ options, onSubmitVote, selectedChoiceId, showOptions }: VotingOptionsProps) {
  const handleVote = (choiceId: string) => {
    if (onSubmitVote) {
      onSubmitVote(choiceId);
    }
  };

  // Helper function to get border colors for box-shadow
  const getBorderColor = (colorClass: string) => {
    const colorMap: Record<string, string> = {
      'from-orange-500 to-orange-600': '#ea580c', // orange-600
      'from-pink-500 to-pink-600': '#db2777', // pink-600
      'from-teal-500 to-teal-600': '#0d9488', // teal-600
      'from-green-600 to-green-700': '#059669', // green-600
    };
    return colorMap[colorClass] || '#ffffff';
  };

  // Default color palette based on the reference image
  const defaultColors = [
    'from-orange-500 to-orange-600', // Orange
    'from-pink-500 to-pink-600',     // Magenta/Deep Pink
    'from-teal-500 to-teal-600',     // Teal/Blue-Green
    'from-green-600 to-green-700',   // Dark Green
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-3 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
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
            animationDelay: `${900 + index * 100}ms`,
            transitionDelay: `${index * 100}ms`
          }}
        >
          {/* Simplified Button with Border Effect */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${option.color || defaultColors[index % defaultColors.length]}`} />
          
          {/* Border Effect using box-shadow */}
          <div className="absolute inset-0 rounded-xl" style={{
            boxShadow: `inset 0 0 0 4px ${getBorderColor(option.color || defaultColors[index % defaultColors.length])}`
          }} />
          
          {/* Highlight and Shimmer in one layer */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Left: Question Mark Avatar */}
            <div className="flex-shrink-0">
              <QuestionMarkAvatar size="xl" />
            </div>
            
            {/* Center: Answer Text */}
            <div className="flex-1">
              <span className="text-white font-bold text-xl">{option.text}</span>
            </div>
            
            {/* Right: Checkmark */}
            {selectedChoiceId === option.id && (
              <span className="text-white font-bold text-2xl animate-bounce flex-shrink-0">
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
