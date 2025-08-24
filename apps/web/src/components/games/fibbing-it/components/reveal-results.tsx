'use client';
import { PlayerAvatar } from '../../shared/ui';

type Option = {
  id: string;
  text: string;
  color: string;
  playerId?: string;
  playerAvatar?: string;
};

type RevealResultsProps = {
  options: Option[];
  correctAnswer?: string;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function RevealResults({ options, correctAnswer, selectedChoiceId, showOptions }: RevealResultsProps) {
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
      {/* Correct Answer Display */}
      {correctAnswer && (
        <div className="mb-6 p-4 bg-green-600/20 border border-green-500/30 rounded-2xl">
          <div className="text-xl font-semibold text-green-300 text-center">
            {correctAnswer}
          </div>
        </div>
      )}
      
      {/* Options with Player Avatars */}
      {options.map((option, index) => (
        <div
          key={option.id}
          className={`
            w-full p-4 rounded-xl transition-all duration-500 transform
            ${showOptions 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
            }
            relative overflow-hidden
          `}
          style={{ 
            animationDelay: `${900 + index * 100}ms`,
            transitionDelay: `${index * 100}ms`
          }}
        >
          {/* Background */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${option.color || defaultColors[index % defaultColors.length]}`} />
          
          {/* Border Effect using box-shadow */}
          <div className="absolute inset-0 rounded-xl" style={{
            boxShadow: `inset 0 0 0 4px ${getBorderColor(option.color || defaultColors[index % defaultColors.length])}`
          }} />
          
          {/* Highlight */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          
          {/* Content with Player Info */}
          <div className="relative z-10 flex items-start gap-3">
            {/* Left-aligned Avatar */}
            {option.playerAvatar && (
              <div className="flex-shrink-0 mt-1">
                <PlayerAvatar 
                  avatar={option.playerAvatar} 
                  size="md" 
                />
              </div>
            )}
            
            {/* Text taking up remaining space */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-2xl drop-shadow-2xl tracking-wide">
                {option.text}
              </div>
            </div>
            
            {/* Checkmark for selected answer */}
            {selectedChoiceId === option.id && (
              <span className="text-white font-bold text-3xl animate-bounce flex-shrink-0 self-center">
                ✓
              </span>
            )}
          </div>
          
          {/* Selected State - Only on selected answer with enhanced animation */}
          {selectedChoiceId === option.id && (
            <div className="absolute inset-0 rounded-xl bg-white/60 animate-slide-in" />
          )}
        </div>
      ))}
    </div>
  );
}
