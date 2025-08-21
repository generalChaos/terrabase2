"use client";
import { TimerRing } from "../timer-ring";
import { PlayerAvatar } from "../player-avatar";

type FibbingItLobbyViewProps = {
  players: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  isHost: boolean;
};

export function FibbingItLobbyView({
  players,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  isHost
}: FibbingItLobbyViewProps) {
  const connectedPlayers = players.filter(p => p.connected !== false);
  const waitingPlayers = connectedPlayers.filter(p => !p.connected);
  const submittingPlayers = connectedPlayers.filter(p => p.connected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-white tracking-wider">FIBBING IT!</h1>
        <div className="text-2xl font-mono text-teal-400 bg-slate-800 px-4 py-2 rounded-lg">
          GR7A
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-6xl font-bold text-white mb-12 tracking-wider">LOBBY</h2>
        
        {/* Players Section */}
        <div className="w-full max-w-4xl">
          {/* Player Avatars Grid */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {connectedPlayers.slice(0, 6).map((player, index) => (
              <div key={player.id} className="flex flex-col items-center">
                <div className="relative">
                  <PlayerAvatar
                    player={player}
                    size="large"
                    className="text-6xl"
                  />
                  {index < 3 && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {player.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          <div className="text-center space-y-4 mb-8">
            {waitingPlayers.length > 0 && (
              <div className="text-2xl text-slate-300">Waiting...</div>
            )}
            {submittingPlayers.length > 0 && (
              <div className="text-2xl text-slate-300">Players submitting...</div>
            )}
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <TimerRing
                timeLeft={timeLeft}
                totalTime={totalTime}
                size={120}
                strokeWidth={8}
                className="text-teal-400"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {Math.ceil(timeLeft / 1000)}s
                </span>
              </div>
            </div>
          </div>

          {/* Start Game Button (Host Only) */}
          {isHost && (
            <div className="flex justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-2xl font-bold px-12 py-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl">
                Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
