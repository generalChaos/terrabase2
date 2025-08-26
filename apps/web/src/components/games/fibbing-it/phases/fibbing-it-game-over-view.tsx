'use client';
import { PhaseLayout, gameStyles, animationDelays } from '../shared';

type FibbingItGameOverViewProps = {
  timeLeft: number;
  roomCode?: string;
  players?: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
  onPlayAgain?: () => void;
  isPlayer?: boolean;
  isHost?: boolean;
};

export function FibbingItGameOverView({
  timeLeft,
  roomCode = 'GR7A',
  players = [],
  onPlayAgain,
  isPlayer = false,
  isHost = false,
}: FibbingItGameOverViewProps) {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Content for both mobile and desktop
  const gameOverContent = (
    <>
      {/* Game Over Title */}
      <h2 className={`text-6xl font-bold text-white tracking-wider mb-8 ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.fast }}>
        GAME OVER!
      </h2>

      {/* Final Results */}
      <div className={`${gameStyles.content.box} ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.medium }}>
        {/* Winner Announcement */}
        {sortedPlayers.length > 0 && (
          <div className="text-center mb-6">
            <div className="text-2xl text-slate-300 mb-2">Winner:</div>
            <div className={`text-4xl font-bold ${gameStyles.text.accent} font-baloo2`}>
              {sortedPlayers[0].name}
            </div>
            <div className="text-xl text-white">
              with {sortedPlayers[0].score} points!
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="space-y-3">
          <h3 className="text-2xl text-white font-bold mb-4 text-center">Final Standings</h3>
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`w-full p-4 rounded-xl transition-all duration-500 transform
                opacity-100 translate-y-0
                relative overflow-hidden ${
                  index === 0 
                    ? 'bg-yellow-500/20 border border-yellow-500' 
                    : 'bg-slate-800/50 border border-slate-600/50'
                }
              `}
              style={{ 
                animationDelay: `${900 + index * 100}ms`,
                transitionDelay: `${index * 100}ms`
              }}
            >
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                {/* Left: Position */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 'bg-slate-700'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Center: Player Name */}
                <div className="flex-1">
                  <span className="text-white font-bold text-xl drop-shadow-2xl tracking-wide">{player.name}</span>
                </div>
                
                {/* Right: Final Score */}
                <div className={`text-white font-black text-3xl ${gameStyles.text.accent} font-baloo2 tracking-wider`}>
                  {player.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Play Again Button (Host only) */}
      {isHost && onPlayAgain && (
        <div className={`mt-8 ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slowest }}>
          <button
            onClick={onPlayAgain}
            className={gameStyles.button.primary}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Player message */}
      {isPlayer && (
        <div className={`mt-6 ${gameStyles.text.body} text-center ${gameStyles.animation.fadeIn}`} style={{ animationDelay: animationDelays.slowest }}>
          Waiting for host to start a new game...
        </div>
      )}
    </>
  );

  return (
    <PhaseLayout
      roomCode={roomCode}
      timeLeft={timeLeft}
      isPlayer={isPlayer}
      isHost={isHost}
      showBackButton={isPlayer}
      onBackClick={() => window.history.back()}
    >
      {gameOverContent}
    </PhaseLayout>
  );
}
