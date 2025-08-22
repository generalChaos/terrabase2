"use client";
import { PlayerAvatar } from '../ui/player-avatar';
import { Copy, Users, Clock, Star, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

type LobbyViewProps = {
  roomCode: string;
  players: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  isHost: boolean;
  onStartGame?: () => void;
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
  isHost,
  onStartGame,
  selectedGame,
  onGameSelect,
  availableGames,
  showAllGames = false
}: LobbyViewProps) {
  const canStartGame = isHost && players.length >= 2 && selectedGame;
  const connectedPlayers = players.filter(p => p.connected !== false);
  const disconnectedPlayers = players.filter(p => p.connected === false);
  
  // Get theme from selected game or use default
  const theme = selectedGame?.theme || {
    primary: "bg-slate-600",
    accent: "bg-teal-500",
    background: "bg-slate-800",
    icon: "🎮",
    name: "Game"
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success('Room code copied to clipboard!', {
        description: `Share ${roomCode} with your friends`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to copy room code:', err);
      toast.error('Failed to copy room code', {
        description: 'Please copy manually: ' + roomCode,
        duration: 5000,
      });
    }
  };

  return (
    <div className={`min-h-screen ${theme.background} p-6`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-wider">LOBBY</h1>
          <p className="text-slate-300 text-lg mt-1">
            {connectedPlayers.length > 0 
              ? `${connectedPlayers.length} player${connectedPlayers.length === 1 ? '' : 's'} ready`
              : 'Waiting for players to join'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomCode}
            className={`${theme.primary} hover:opacity-90 transition-opacity px-4 py-2 rounded-lg flex items-center gap-2`}
          >
            <span className="text-2xl font-mono text-white">{roomCode}</span>
            <Copy className="w-4 h-4 text-white" />
          </button>
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
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedGame.players}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedGame.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {selectedGame.difficulty}
                      </span>
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
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {game.players}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {game.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {game.difficulty}
                          </span>
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
          <div className="text-2xl text-white/80">
            {connectedPlayers.length === 0 && 'Waiting for players...'}
            {connectedPlayers.length === 1 && '1 player ready'}
            {connectedPlayers.length >= 2 && `${connectedPlayers.length} players ready`}
          </div>
          {disconnectedPlayers.length > 0 && (
            <div className="text-sm text-orange-400 mt-2">
              {disconnectedPlayers.length} player{disconnectedPlayers.length === 1 ? '' : 's'} disconnected
            </div>
          )}
          
          {/* Player Count Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
            <Users className="w-4 h-4" />
            <span>
              {connectedPlayers.length} / {selectedGame?.players?.split('-')[1] || '8'} players
            </span>
            {connectedPlayers.length >= 2 && (
              <span className="text-green-400 ml-2">✓ Ready to start</span>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Players</h2>
          <div className="flex justify-center gap-8 flex-wrap">
            {connectedPlayers.length > 0 ? (
              connectedPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className="text-center relative animate-in slide-in-from-bottom-2 fade-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative group">
                    <PlayerAvatar 
                      avatar={player.avatar}
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Wifi className="w-2 h-2 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-200"></div>
                  </div>
                  <div className="text-white mt-2 font-medium">{player.name}</div>
                  <div className="text-xs text-white/60">Score: {player.score}</div>
                </div>
              ))
            ) : (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center">
                    <div className="text-2xl opacity-50">👤</div>
                  </div>
                  <div className="text-white/50 mt-2 text-sm">Waiting...</div>
                </div>
              ))
            )}
          </div>
          
          {/* Disconnected Players */}
          {disconnectedPlayers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="text-lg font-semibold text-orange-400 mb-4 text-center">Disconnected Players</h3>
              <div className="flex justify-center gap-8 flex-wrap">
                {disconnectedPlayers.map((player) => (
                  <div key={player.id} className="text-center relative">
                    <div className="relative">
                      <PlayerAvatar 
                        avatar={player.avatar}
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <WifiOff className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="text-white/60 mt-2 font-medium">{player.name}</div>
                    <div className="text-xs text-white/40">Disconnected</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {players.length === 0 && (
            <div className="mt-6 text-center text-white/60">
              <div className="mb-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-lg font-medium text-white/80">Ready to play?</p>
              </div>
              <p className="mb-3">Share the room code with friends to get started!</p>
              <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                <p className="text-sm text-white/70 mb-1">Room Code:</p>
                <p className="font-mono text-lg text-white font-bold">{roomCode}</p>
              </div>
              <div className="mt-4 text-xs text-white/50 space-y-1">
                <p>• Send them to: <span className="font-mono text-white/70">/join/{roomCode}</span></p>
                <p>• Or copy the code above and share it directly</p>
              </div>
            </div>
          )}
        </div>

        {/* Start Game Button */}
        {isHost && (
          <div className="text-center">
            <button
              onClick={onStartGame}
              disabled={!canStartGame}
              className={`w-full h-16 rounded-2xl font-bold text-xl transition-all duration-200 ${
                canStartGame
                  ? `${theme.primary} hover:opacity-90 text-white transform hover:scale-105 shadow-lg shadow-black/20`
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
              }`}
            >
              {canStartGame ? (
                <div className="flex items-center justify-center gap-2">
                  <span>🎮 Start Game!</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                `Need at least 2 players${!selectedGame ? ' and a game selected' : ''}`
              )}
            </button>
            {!canStartGame && (
              <div className="mt-3 text-sm text-white/60">
                {players.length < 2 && `Players: ${players.length}/2`}
                {!selectedGame && ' • Select a game to begin'}
              </div>
            )}
            {canStartGame && (
              <div className="mt-3 text-sm text-green-400 animate-pulse">
                ✨ All players are ready! Click to begin the adventure!
              </div>
            )}
          </div>
        )}

        {/* Ready Indicator for Non-Host Players */}
        {!isHost && connectedPlayers.length >= 2 && (
          <div className="text-center">
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-lg font-semibold text-green-400 mb-2">Ready to Play!</div>
              <div className="text-sm text-green-300">
                Waiting for the host to start the game...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
