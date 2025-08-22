"use client";
import { PlayerAvatar } from '../ui/player-avatar';

type LobbyViewProps = {
  roomCode: string;
  players: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  isHost: boolean;
  onStartGame?: () => void;
  maxPlayers?: number;
  selectedGame?: {
    id: string;
    title: string;
    description: string;
    icon: string;
    players: string;
    duration: string;
    difficulty: string;
    theme?: {
      primary: string;
      accent: string;
      background: string;
      icon: string;
      name: string;
    };
  };
  onGameSelect?: (gameId: string) => void;
  availableGames?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    players: string;
    duration: string;
    difficulty: string;
    theme?: {
      primary: string;
      accent: string;
      background: string;
      icon: string;
      name: string;
    };
  }>;
  showAllGames?: boolean;
};

export function LobbyView({
  roomCode,
  players,
  timeLeft,
  totalTime,
  round,
  maxRounds,
  isHost,
  onStartGame,
  maxPlayers = 8,
  selectedGame,
  onGameSelect,
  availableGames,
  showAllGames = false
}: LobbyViewProps) {
  const canStartGame = isHost && players.length >= 2 && selectedGame;
  
  // Get theme from selected game or use default
  const theme = selectedGame?.theme || {
    primary: "bg-slate-600",
    accent: "bg-teal-500",
    background: "bg-slate-800",
    icon: "🎮",
    name: "Game"
  };

  return (
    <div className={`min-h-screen ${theme.background} p-6`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-wider">LOBBY</h1>
          <p className="text-slate-300 text-lg mt-1">Waiting for players to join</p>
        </div>
        <div className={`text-2xl font-mono text-white ${theme.primary} px-4 py-2 rounded-lg`}>
          {roomCode}
        </div>
      </div>

      {/* Main Content - Single Column Layout */}
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Game Selection */}
        {isHost && availableGames && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Game Selection</h2>
            
            {/* Selected Game Display */}
            {selectedGame && (
              <div className={`mb-6 p-6 rounded-2xl border-2 ${theme.primary} border-white/30`}>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-5xl">{selectedGame.icon}</div>
                  <div>
                    <div className="text-3xl font-bold text-white">{selectedGame.title}</div>
                    <div className="text-lg text-white/80 mt-2">{selectedGame.description}</div>
                    <div className="flex gap-6 mt-3 text-sm text-white/70">
                      <span>{selectedGame.players}</span>
                      <span>{selectedGame.duration}</span>
                      <span>{selectedGame.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Change Game Button */}
            <button
              onClick={() => onGameSelect?.('toggle')}
              className={`w-full p-4 rounded-2xl ${theme.accent} hover:opacity-90 transition-all duration-200 text-white font-semibold text-lg`}
            >
              {selectedGame ? 'Change Game' : 'Select a Game'}
            </button>

            {/* Expanded Game List */}
            {showAllGames && (
              <div className="mt-6 space-y-3">
                <div className="text-sm text-white/70 mb-3">Available Games:</div>
                {availableGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => onGameSelect?.(game.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedGame?.id === game.id
                        ? `${theme.primary} border-white/50`
                        : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{game.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white text-lg">{game.title}</div>
                        <div className="text-sm text-white/70">{game.description}</div>
                        <div className="flex gap-4 mt-2 text-xs text-white/50">
                          <span>{game.players}</span>
                          <span>{game.duration}</span>
                          <span>{game.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <div className="text-2xl text-white/80">Waiting...</div>
        </div>

        {/* Players */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Players</h2>
          <div className="flex justify-center gap-8">
            {players.length > 0 ? (
              players.map((player, index) => (
                <div key={player.id} className="text-center">
                  <PlayerAvatar 
                    {...player} 
                    connected={player.connected ?? true}
                  />
                  <div className="text-white mt-2 font-medium">{player.name}</div>
                </div>
              ))
            ) : (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center">
                    <div className="text-2xl opacity-50">👤</div>
                  </div>
                  <div className="text-white/50 mt-2 text-sm">Waiting...</div>
                </div>
              ))
            )}
          </div>
          
          {players.length === 0 && (
            <div className="mt-6 text-center text-white/60">
              <p>Share the room code with friends to get started!</p>
              <p className="text-sm mt-2">Room: <span className="font-mono text-white">{roomCode}</span></p>
            </div>
          )}
        </div>

        {/* Start Game Button */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className={`w-full h-16 rounded-2xl font-bold text-xl transition-all duration-200 ${
              canStartGame
                ? `${theme.primary} hover:opacity-90 text-white transform hover:scale-105`
                : 'bg-white/20 text-white/50 cursor-not-allowed'
            }`}
          >
            {canStartGame ? 'Ready Up' : 'Need at least 2 players and a game selected'}
          </button>
        )}
      </div>
    </div>
  );
}
