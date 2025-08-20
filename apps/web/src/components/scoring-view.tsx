"use client";
import { TimerRing } from "./timer-ring";
import type { Choice, Vote } from "@party/types";

type SimplePlayer = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected?: boolean;
};

type ScoringViewProps = {
  question: string;
  correctAnswer: string;
  choices: Choice[];
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  votes: Vote[];
  players: SimplePlayer[];
  scores: Array<{ playerId: string; score: number }>;
};

export function ScoringView({ 
  question, 
  correctAnswer,
  choices, 
  timeLeft, 
  totalTime, 
  round, 
  maxRounds,
  votes,
  players,
  scores
}: ScoringViewProps) {
  
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const getVoteCount = (choiceId: string) => {
    return votes.filter(v => v.choiceId === choiceId).length;
  };

  const getVoterNames = (choiceId: string) => {
    const voters = votes.filter(v => v.choiceId === choiceId);
    return voters.map(v => getPlayerName(v.voter));
  };

  const getScoreForPlayer = (playerId: string) => {
    const scoreData = scores.find(s => s.playerId === playerId);
    return scoreData?.score || 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Round indicator */}
      <div className="mb-8">
        <div className="text-sm text-[--muted] mb-2">Round {round} of {maxRounds}</div>
        <div className="w-24 h-1 bg-[--panel] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[--accent] transition-all duration-300 ease-out"
            style={{ width: `${(round / maxRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer and Question */}
      <div className="flex flex-col items-center gap-8 mb-8">
        <TimerRing seconds={timeLeft} total={totalTime} />
        
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-[--text] leading-tight mb-4">
            {question}
          </h1>
          <div className="text-xl text-[--success] font-semibold">
            ✅ Correct Answer: <span className="text-[--text]">{correctAnswer}</span>
          </div>
        </div>
      </div>

      {/* Results Breakdown */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Round Results</h2>
        
        {/* Choices and Vote Results */}
        <div className="grid gap-4 mb-8">
          {choices.map((choice) => {
            const voteCount = getVoteCount(choice.id);
            const voterNames = getVoterNames(choice.id);
            const isTruth = choice.id.startsWith('TRUE::');
            const isBluff = !isTruth;
            const bluffAuthor = isBluff ? getPlayerName(choice.by) : null;
            
            return (
              <div 
                key={choice.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isTruth 
                    ? 'border-[--success] bg-[--success]/10' 
                    : 'border-[--border] bg-[--panel]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      isTruth 
                        ? 'bg-[--success] text-black font-semibold' 
                        : 'bg-[--warning] text-black font-semibold'
                    }`}>
                      {isTruth ? 'TRUTH' : 'BLUFF'}
                    </span>
                    <span className="text-lg font-medium">{choice.text}</span>
                    {bluffAuthor && (
                      <span className="text-sm text-[--muted]">by {bluffAuthor}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[--accent]">{voteCount}</div>
                    <div className="text-sm text-[--muted]">votes</div>
                  </div>
                </div>
                
                {voterNames.length > 0 && (
                  <div className="text-sm text-[--muted]">
                    Voted by: {voterNames.join(', ')}
                  </div>
                )}
                
                {/* Scoring details */}
                {isTruth && voteCount > 0 && (
                  <div className="mt-2 text-sm text-[--success]">
                    💰 {voteCount} player(s) earned 1000 points for finding the truth!
                  </div>
                )}
                {isBluff && voteCount > 0 && bluffAuthor && (
                  <div className="mt-2 text-sm text-[--warning]">
                    🎭 {bluffAuthor} earned {voteCount * 500} points for fooling {voteCount} player(s)!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Player Scores */}
        <div className="bg-[--panel] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Current Standings</h3>
          <div className="grid gap-3">
            {players
              .map(player => ({
                ...player,
                totalScore: getScoreForPlayer(player.id)
              }))
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-[--bg] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-[--warning]' : 
                      index === 1 ? 'text-[--accent]' : 
                      index === 2 ? 'text-[--muted]' : 'text-[--text]'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-2xl">{player.avatar || '🙂'}</span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[--accent]">{player.totalScore}</div>
                    <div className="text-sm text-[--muted]">points</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-8 text-[--muted] text-center">
        <p className="text-sm">Next round starts in {timeLeft} seconds...</p>
      </div>
    </div>
  );
}
