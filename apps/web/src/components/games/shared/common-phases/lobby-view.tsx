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
  const [displayMode, setDisplayMode] = useState<'connection' | 'points'>('connection');
  
  const connectedPlayers = players.filter(p => p.connected !== false);
  const disconnectedPlayers = players.filter(p => p.connected === false);
  const canStartGame = isHost && connectedPlayers.length >= 2 && selectedGame;

  useEffect(() => {
    setMounted(true);
    console.log('🎮 LobbyView mounted with props:', { 
      roomCode, 
      players: players.length, 
      isHost, 
      canStartGame,
      connectedPlayers: connectedPlayers.length,
      selectedGame: selectedGame?.id 
    });
  }, [roomCode, players.length, isHost, canStartGame, connectedPlayers.length, selectedGame?.id]);

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
    <div className="flex flex-col justify-center py-8">
      <div className={`max-w-4xl mx-auto space-y-6 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Players List */}
        <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          
          {/* Players */}
          {players.length > 0 ? (
            <div className="space-y-4">
              {players.map((player, index) => {
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-6 p-6 rounded-2xl transition-all duration-200 animate-fade-in-up w-full ${
                      player.connected !== false
                        ? 'bg-slate-800/80'
                        : 'bg-slate-800/40'
                    }`}
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <PlayerAvatar avatar={player.avatar} size="2xl" />
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

                    {/* Player Info & Score */}
                    <div className="flex-1">
                      <div className={`font-medium text-xl mb-2 ${
                        player.connected !== false 
                          ? 'text-white' 
                          : 'text-white/60'
                      }`}>
                        {player.name}
                      </div>
                      
                      {/* Connection Status or Points */}
                      {displayMode === 'connection' ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            player.connected !== false ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-slate-400">
                            {player.connected !== false ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Score tier indicator */}
                          <div className={`w-3 h-3 rounded-full ${
                            player.score >= 1000 ? 'bg-green-500' : 
                            player.score >= 500 ? 'bg-orange-500' : 
                            'bg-red-500'
                          }`}></div>
                          <div className="text-2xl font-bold text-white">
                            {player.score}
                          </div>
                          <span className="text-sm text-slate-400">pts</span>
                        </div>
                      )}
                      
                      {player.connected === false && (
                        <div className="text-sm text-orange-400 mt-2">Disconnected</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-medium text-white mb-2">
                Ready to play?
              </h3>
              <p className="text-slate-300">
                Share the room code with friends to get started!
              </p>
            </div>
          )}
        </div>

        {/* Player Count and Display Toggle */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="inline-flex items-center gap-2 text-sm text-slate-400 mb-3">
            <Users className="w-4 h-4" />
            <span>
              {connectedPlayers.length} / {selectedGame?.players?.split('-')[1] || '8'} players
            </span>
            {connectedPlayers.length >= 2 && (
              <span className="text-green-400 ml-2">✓ Ready!</span>
            )}
          </div>
          
          {disconnectedPlayers.length > 0 && (
            <div className="text-xs text-orange-400 mb-3">
              {disconnectedPlayers.length} player{disconnectedPlayers.length === 1 ? '' : 's'} disconnected
            </div>
          )}

          {/* Display Mode Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-800/50 rounded-lg p-1 border border-slate-600/50">
              <button
                onClick={() => setDisplayMode('connection')}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                  displayMode === 'connection'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Connection
              </button>
              <button
                onClick={() => setDisplayMode('points')}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                  displayMode === 'points'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Points
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          {/* Start Game Button - Host Only */}
          {isHost && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  console.log('🚀 Start game button clicked!', { 
                    canStartGame, 
                    connectedPlayers: connectedPlayers.length,
                    selectedGame: selectedGame?.id,
                    onStartGame: !!onStartGame 
                  });
                  onStartGame?.();
                }}
                disabled={!canStartGame}
                className={`
                  px-12 py-4 rounded-3xl font-bold text-xl transition-all duration-300
                  ${canStartGame 
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1'
                    : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                  }
                `}
              >
                {canStartGame ? 'Start Game' : 'Need 2+ players'}
              </button>
              
              {canStartGame && (
                <div className="text-sm text-slate-400 animate-pulse">
                  Ready to start {selectedGame?.title || 'the game'}!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Info - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
            <details className="inline-block text-left">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                Debug Info
              </summary>
              <div className="mt-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400 space-y-1">
                <div>isHost: {isHost.toString()}</div>
                <div>connectedPlayers: {connectedPlayers.length}</div>
                <div>totalPlayers: {players.length}</div>
                <div>selectedGame: {selectedGame?.id || 'none'}</div>
                <div>canStartGame: {canStartGame?.toString() || 'false'}</div>
                <div>onStartGame: {onStartGame ? 'function' : 'undefined'}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
