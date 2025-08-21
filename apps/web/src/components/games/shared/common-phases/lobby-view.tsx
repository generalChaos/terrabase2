"use client";
import { TimerRing, PlayerAvatar } from "../ui";

type LobbyViewProps = {
  gameTitle: string;
  roomCode: string;
  players: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  isHost: boolean;
  onStartGame?: () => void;
  maxPlayers?: number;
};

export function LobbyView({
  gameTitle,
  roomCode,
  players,
  timeLeft,
  totalTime,
  round = 1,
  maxRounds = 1,
  isHost,
  onStartGame,
  maxPlayers = 6
}: LobbyViewProps) {
  const connectedPlayers = players.filter(p => p.connected !== false);
  const waitingPlayers = connectedPlayers.filter(p => !p.connected);
  const readyPlayers = connectedPlayers.filter(p => p.connected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-white tracking-wider">{gameTitle}</h1>
        <div className="text-2xl font-mono text-teal-400 bg-slate-800 px-4 py-2 rounded-lg">
          {roomCode}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-6xl font-bold text-white mb-12 tracking-wider">LOBBY</h2>
        
        {/* Players Section */}
        <div className="w-full max-w-4xl">
          {/* Player Avatars Grid */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {connectedPlayers.slice(0, maxPlayers).map((player, index) => (
              <div key={player.id} className="flex flex-col items-center">
                <div className="relative">
                  <PlayerAvatar
                    name={player.name}
                    avatar={player.avatar}
                    connected={player.connected ?? true}
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
              <div className="text-2xl text-slate-300">Waiting for players...</div>
            )}
            {readyPlayers.length > 0 && (
              <div className="text-2xl text-slate-300">{readyPlayers.length} players ready</div>
            )}
          </div>

          {/* Timer */}
          {timeLeft !== undefined && totalTime !== undefined && (
            <div className="flex justify-center mb-8">
              <TimerRing seconds={Math.ceil(timeLeft / 1000)} total={Math.ceil(totalTime / 1000)} />
            </div>
          )}

          {/* Start Game Button (Host Only) */}
          {isHost && onStartGame && (
            <div className="flex justify-center">
              <button 
                onClick={onStartGame}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-2xl font-bold px-12 py-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
              >
                Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
