'use client';
import { PlayerAvatar, QuestionMarkAvatar } from '../../shared/ui';

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
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number }>;
  selectedChoiceId?: string;
  showOptions: boolean;
  state?: 'options' | 'reveal' | 'scoring' | 'game-over';
  onPlayAgain?: () => void;
};

export function RevealResults({ options, correctAnswer, votes = [], players = [], selectedChoiceId, showOptions, state = 'reveal', onPlayAgain }: RevealResultsProps) {
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

  // Helper function to get voters for a specific choice
  const getVotersForChoice = (choiceId: string) => {
    return votes.filter(vote => vote.choiceId === choiceId);
  };

  // Helper function to get voter avatars
  const getVoterAvatars = (choiceId: string) => {
    const voters = getVotersForChoice(choiceId);
    return voters.map(vote => {
      const player = players.find(p => p.id === vote.voter);
      return player?.avatar || 'avatar_1';
    });
  };

  // Helper function to calculate points for an answer
  const calculatePoints = (choiceId: string) => {
    const voters = getVotersForChoice(choiceId);
    // Basic scoring: 100 points per vote
    return voters.length * 100;
  };

  // Default color palette based on the reference image
  const defaultColors = [
    'from-orange-500 to-orange-600', // Orange
    'from-pink-500 to-pink-600',     // Magenta/Deep Pink
    'from-teal-500 to-teal-600',     // Teal/Blue-Green
    'from-green-600 to-green-700',   // Dark Green
  ];

  // If we're in scoring state and have players, show player list with scores
  if (state === 'scoring' && players.length > 0) {
    // Sort players by score (highest to lowest)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="w-full max-w-md mx-auto space-y-3 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        {/* Player List with Scores */}
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`
              w-full p-4 rounded-xl transition-all duration-500 transform
              opacity-100 translate-y-0
              relative overflow-hidden bg-slate-800/50 border border-slate-600/50
            `}
            style={{ 
              animationDelay: `${900 + index * 100}ms`,
              transitionDelay: `${index * 100}ms`
            }}
          >
            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Left: Player Avatar */}
              <div className="flex-shrink-0">
                <PlayerAvatar avatar={player.avatar || 'avatar_1'} size="xl" />
              </div>
              
              {/* Center: Player Name */}
              <div className="flex-1">
                <span className="text-white font-bold text-xl drop-shadow-2xl tracking-wide">{player.name}</span>
              </div>
              
              {/* Right: Points */}
              <div className="text-white font-black text-3xl text-teal-400 font-baloo2 tracking-wider">
                {player.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If we're in game over state, show final scores with play again button
  if (state === 'game-over' && players.length > 0) {
    // Sort players by score (highest to lowest)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="w-full max-w-md mx-auto space-y-3 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        {/* Game Over Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white font-baloo2">Game Over!</h1>
        </div>
        
        {/* Player List with Final Scores */}
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`
              w-full p-4 rounded-xl transition-all duration-500 transform
              opacity-100 translate-y-0
              relative overflow-hidden bg-slate-800/50 border border-slate-600/50
            `}
            style={{ 
              animationDelay: `${900 + index * 100}ms`,
              transitionDelay: `${index * 100}ms`
            }}
          >
            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              {/* Left: Player Avatar */}
              <div className="flex-shrink-0">
                <PlayerAvatar avatar={player.avatar || 'avatar_1'} size="xl" />
              </div>
              
              {/* Center: Player Name */}
              <div className="flex-1">
                <span className="text-white font-bold text-xl drop-shadow-2xl tracking-wide">{player.name}</span>
              </div>
              
              {/* Right: Final Score */}
              <div className="text-white font-black text-3xl text-teal-400 font-baloo2 tracking-wider">
                {player.score}
              </div>
            </div>
          </div>
        ))}
        
        {/* Play Again Button */}
        <div className="text-center mt-8">
          <button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl font-baloo2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Original options display for reveal state (showing answer choices with voters)
  return (
    <div className="w-full max-w-md mx-auto space-y-3 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
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
          <div className="relative z-10 flex items-center gap-3">
            {/* Left-aligned Avatar */}
            <div className="flex-shrink-0">
              {option.playerAvatar ? (
                <PlayerAvatar 
                  avatar={option.playerAvatar} 
                  size="xl" 
                />
              ) : (
                <QuestionMarkAvatar size="xl" />
              )}
            </div>
            
            {/* Middle and Right Content */}
            <div className="flex-1 min-w-0 flex items-center justify-between">
              {/* Center: Voter Avatars (only in reveal state) */}
              {state === 'reveal' && votes.length > 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex -space-x-2">
                    {getVoterAvatars(option.id).map((avatar, index) => (
                      <PlayerAvatar 
                        key={index}
                        avatar={avatar} 
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Right: Points (only in reveal state) */}
              {state === 'reveal' && votes.length > 0 && (
                <div className="text-white font-bold text-3xl font-baloo2">
                  +{calculatePoints(option.id)}
                </div>
              )}
            </div>
          </div>
          
        </div>
      ))}
    </div>
  );
}
