"use client";
import { PlayerAvatar } from "../ui";

type ResultsViewProps = {
  gameTitle: string;
  scores: Array<{ playerId: string; score: number }>;
  players: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  round: number;
  maxRounds: number;
  onPlayAgain?: () => void;
  onBackToLobby?: () => void;
};

export function ResultsView({
  gameTitle,
  scores,
  players,
  round,
  onPlayAgain,
  onBackToLobby
}: ResultsViewProps) {
  // Find the winner (player with highest score)
  const winner = scores.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );
  
  const winnerPlayer = players.find(p => p.id === winner.playerId);

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores.find(s => s.playerId === a.id)?.score || 0;
    const scoreB = scores.find(s => s.playerId === b.id)?.score || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-white tracking-wider">{gameTitle}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-8 w-full max-w-4xl">
          {/* Winner Announcement */}
          <div className="mb-12">
            <h2 className="text-6xl font-bold text-yellow-400 mb-4 tracking-wider">
              {winnerPlayer?.name || "Unknown"} WINS!
            </h2>
            
            {/* Confetti Effect */}
            <div className="flex justify-center space-x-2 mb-8">
              {['🎉', '🎊', '✨', '🎈', '🎆', '🎇'].map((emoji, index) => (
                <span
                  key={index}
                  className="text-4xl animate-bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Panel - Player Scores */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600">
              <h3 className="text-2xl font-bold text-white mb-6">Final Scores</h3>
              <div className="space-y-4">
                {sortedPlayers.map((player) => {
                  const score = scores.find(s => s.playerId === player.id)?.score || 0;
                  const isWinner = player.id === winner.playerId;
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        isWinner ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar
                          avatar={player.avatar}
                        />
                        <span className={`font-medium ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                          {player.name}
                        </span>
                      </div>
                      <span className={`text-xl font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                        {score.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Additional Stats */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600">
              <h3 className="text-2xl font-bold text-white mb-6">Game Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl">
                  <span className="text-slate-300">Rounds Played</span>
                  <span className="text-white font-bold">{round}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl">
                  <span className="text-slate-300">Total Players</span>
                  <span className="text-white font-bold">{players.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl">
                  <span className="text-slate-300">Winner Score</span>
                  <span className="text-yellow-400 font-bold">{winner.score.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            {onPlayAgain && (
              <button 
                onClick={onPlayAgain}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-2xl font-bold px-12 py-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
              >
                Play Again
              </button>
            )}
            {onBackToLobby && (
              <button 
                onClick={onBackToLobby}
                className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold px-12 py-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
              >
                Back to Lobby
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
