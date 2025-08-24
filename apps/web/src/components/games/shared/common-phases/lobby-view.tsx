'use client';
import { useState, useEffect } from "react";
import { PlayerAvatar } from '../ui/player-avatar';
import { Users, Wifi, WifiOff, Play } from 'lucide-react';

type LobbyViewProps = {
  roomCode: string;
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
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
};

export function LobbyView({
  roomCode,
  players,
  isHost,
  onStartGame,
  selectedGame,
}: LobbyViewProps) {
  const [mounted, setMounted] = useState(false);
  
  const canStartGame = isHost && players.length >= 2 && selectedGame;
  const connectedPlayers = players.filter(p => p.connected !== false);
  const disconnectedPlayers = players.filter(p => p.connected === false);

  useEffect(() => {
    setMounted(true);
    console.log('🎮 LobbyView mounted with props:', { roomCode, players: players.length, isHost });
  }, [roomCode, players.length, isHost]);

  // Loading state while components mount
  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-400 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Lobby</h2>
          <p className="text-slate-300">Preparing your game room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Main Content */}
      <div className={`max-w-6xl mx-auto space-y-8 pt-8 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Player Status */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3">
            <Users className="w-5 h-5 text-white" />
            <span className="text-lg text-white font-medium">
              {connectedPlayers.length} / {selectedGame?.players?.split('-')[1] || '8'} players
            </span>
            {connectedPlayers.length >= 2 && (
              <span className="text-green-400 ml-2 animate-pulse">✓ Ready!</span>
            )}
          </div>
          
          {disconnectedPlayers.length > 0 && (
            <div className="mt-3 text-sm text-orange-400">
              {disconnectedPlayers.length} player{disconnectedPlayers.length === 1 ? '' : 's'} disconnected
            </div>
          )}
        </div>

        {/* Players Grid */}
        <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {players.length > 0
                ? players.map((player, index) => (
                    <div
                      key={player.id}
                      className="text-center animate-fade-in-up"
                      style={{ animationDelay: `${200 + index * 50}ms` }}
                    >
                      <div className="relative mb-3">
                        <div className="relative inline-block">
                          <PlayerAvatar avatar={player.avatar} size="xl" />
                          <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                            player.connected !== false 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}>
                            {player.connected !== false ? (
                              <Wifi className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <WifiOff className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium text-sm ${
                        player.connected !== false 
                          ? 'text-white' 
                          : 'text-white/60'
                      }`}>
                        {player.name}
                      </div>
                      {player.connected === false && (
                        <div className="text-xs text-white/40">Disconnected</div>
                      )}
                    </div>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="text-center animate-pulse">
                      <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center mx-auto mb-3">
                        <div style={{ fontSize: 'var(--avatar-font-lg)' }} className="opacity-50">👤</div>
                      </div>
                      <div className="text-white/50 text-sm">Waiting...</div>
                    </div>
                  ))}
            </div>

            {/* Empty State */}
            {players.length === 0 && (
              <div className="mt-8 text-center text-white/60">
                <div className="mb-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-lg font-medium text-white/80">
                    Ready to play?
                  </p>
                </div>
                <p className="mb-3">
                  Share the room code with friends to get started!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Start Game Button - Host Only */}
        {isHost && (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <button
              onClick={onStartGame}
              disabled={!canStartGame}
              className={`
                relative w-full max-w-md mx-auto py-6 px-8 rounded-3xl font-bold text-xl
                transition-all duration-300 transform
                ${canStartGame 
                  ? 'bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600 hover:from-teal-400 hover:via-blue-500 hover:to-purple-500 text-white shadow-2xl hover:shadow-glow hover:-translate-y-2 hover:scale-105 active:translate-y-0 active:scale-100'
                  : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                }
              `}
            >
              {canStartGame ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="relative">
                    <Play className="w-7 h-7 relative z-10" />
                    <div className="absolute inset-0 bg-white/30 rounded-full blur-sm animate-pulse"></div>
                  </div>
                  <span className="text-2xl font-bold tracking-wide">Start Game!</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : (
                <span className="text-lg">Need at least 2 players to start</span>
              )}
              
              {/* Animated background gradient for enabled state */}
              {canStartGame && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-600/20 via-blue-700/20 to-purple-700/20 blur-xl animate-pulse"></div>
              )}
            </button>
            
            {!canStartGame && (
              <div className="mt-3 text-sm text-white/60">
                {players.length < 2 && `Players: ${players.length}/2`}
                {!selectedGame && ' • Select a game to begin'}
              </div>
            )}
          </div>
        )}

        {/* Ready Indicator for Non-Host Players */}
        {!isHost && connectedPlayers.length >= 2 && (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-2">
                Ready to Play!
              </h3>
              <p className="text-green-300">
                Waiting for the host to start the game...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
