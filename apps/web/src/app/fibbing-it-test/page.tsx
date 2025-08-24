'use client';
import { useState } from 'react';
import { SharedPromptView } from '@/components/games/fibbing-it/components';
import { LobbyView } from '@/components/games/shared/common-phases/lobby-view';
import { getAllGames } from '@party/config';

type GamePhase = 'lobby' | 'prompt' | 'choose' | 'reveal' | 'scoring' | 'over';

export default function FibbingItTestPage() {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('lobby');
  const [mockState, setMockState] = useState({
    timeLeft: 30000, // 30 seconds
    totalTime: 30000,
    round: 1,
    maxRounds: 5,
    question: "What's the most embarrassing thing that happened to you in school?",
    choices: [
      { id: '1', text: 'Tripped in front of the whole class', color: 'from-orange-500 to-orange-600', playerId: 'player1', playerAvatar: 'avatar_2' },
      { id: '2', text: 'Called the teacher "mom"', color: 'from-pink-500 to-pink-600', playerId: 'player2', playerAvatar: 'avatar_3' },
      { id: '3', text: 'Forgot to wear pants under my dress', color: 'from-teal-500 to-teal-600', playerId: 'player3', playerAvatar: 'avatar_4' },
      { id: '4', text: 'Farted during a test', color: 'from-green-600 to-green-700', playerId: 'host', playerAvatar: 'avatar_1' },
    ],
    votes: [
      { voter: 'player1', choiceId: '1' },
      { voter: 'player2', choiceId: '2' },
      { voter: 'player3', choiceId: '1' },
    ],
    players: [
      { id: 'host', name: 'Host Player', avatar: 'avatar_1', score: 150, connected: true },
      { id: 'player1', name: 'Alice', avatar: 'avatar_2', score: 120, connected: true },
      { id: 'player2', name: 'Bob', avatar: 'avatar_3', score: 90, connected: true },
      { id: 'player3', name: 'Charlie', avatar: 'avatar_4', score: 200, connected: true },
      { id: 'player4', name: 'Diana', avatar: 'avatar_5', score: 75, connected: false },
    ],
    scores: [
      { playerId: 'host', score: 150 },
      { playerId: 'player1', score: 120 },
      { playerId: 'player2', score: 90 },
      { playerId: 'player3', score: 200 },
      { playerId: 'player4', score: 75 },
    ],
    correctAnswer: 'Tripped in front of the whole class',
    hasSubmittedAnswer: false,
    hasVoted: false,
    selectedChoiceId: '',
  });

  const selectedGame = getAllGames().find(game => game.id === 'fibbing-it');

  const handleStartGame = () => {
    setCurrentPhase('prompt');
  };

  const handleSubmitAnswer = (answer: string) => {
    console.log('Answer submitted:', answer);
    setMockState(prev => ({ ...prev, hasSubmittedAnswer: true }));
    // Simulate moving to voting phase after a delay
    setTimeout(() => setCurrentPhase('choose'), 2000);
  };

  const handleSubmitVote = (choiceId: string) => {
    console.log('Vote submitted:', choiceId);
    setMockState(prev => ({ 
      ...prev, 
      hasVoted: true, 
      selectedChoiceId: choiceId 
    }));
    // Stay on voting phase - no automatic progression
  };

  const resetGame = () => {
    setMockState(prev => ({
      ...prev,
      hasSubmittedAnswer: false,
      hasVoted: false,
      selectedChoiceId: '',
      timeLeft: 30000,
    }));
    setCurrentPhase('lobby');
  };

  const nextRound = () => {
    if (mockState.round < mockState.maxRounds) {
      setMockState(prev => ({
        ...prev,
        round: prev.round + 1,
        hasSubmittedAnswer: false,
        hasVoted: false,
        selectedChoiceId: '',
        timeLeft: 30000,
        question: "What's the weirdest food combination you actually enjoy?",
      }));
      setCurrentPhase('prompt');
    } else {
      setCurrentPhase('over');
    }
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'lobby':
        return (
          <LobbyView
            roomCode="TEST123"
            players={mockState.players}
            isHost={true}
            onStartGame={handleStartGame}
            selectedGame={selectedGame}
          />
        );

      case 'prompt':
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}
            state="input"
            onSubmitAnswer={handleSubmitAnswer}
            hasSubmitted={mockState.hasSubmittedAnswer}
          />
        );

      case 'choose':
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}
            state="options"
            options={mockState.choices}
            onSubmitVote={handleSubmitVote}
            selectedChoiceId={mockState.selectedChoiceId}
          />
        );

      case 'reveal':
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}
            state="reveal"
            options={mockState.choices}
            correctAnswer={mockState.correctAnswer}
            onSubmitVote={handleSubmitVote}
            selectedChoiceId={mockState.selectedChoiceId}
          />
        );

      case 'scoring':
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}

            state="reveal"
            options={mockState.choices}
            correctAnswer={mockState.correctAnswer}
            onSubmitVote={handleSubmitVote}
            selectedChoiceId={mockState.selectedChoiceId}
          />
        );

      case 'over':
        return (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-fade-in min-h-screen">
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <h1 className="text-6xl font-bold text-white mb-8">Game Over!</h1>
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-600 max-w-2xl">
                <h2 className="text-2xl text-white mb-6">Final Scores</h2>
                <div className="space-y-3">
                  {mockState.scores
                    .sort((a, b) => b.score - a.score)
                    .map((score, index) => {
                      const player = mockState.players.find(p => p.id === score.playerId);
                      return (
                        <div key={score.playerId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                            <span className="text-white font-medium">{player?.name || 'Unknown'}</span>
                          </div>
                          <span className="text-2xl font-bold text-teal-400">{score.score}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="relative">
      {/* Back to Home */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-slate-800/90 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-600/50 text-white hover:bg-slate-700/90 transition-colors"
        >
          ← Back to Home
        </button>
      </div>

      {/* Navigation Controls - Moved to left side */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-slate-800/90 backdrop-blur-sm rounded-2xl p-3 border border-slate-600/50 max-h-[80vh] overflow-y-auto w-32">
        <h3 className="text-lg font-bold text-white mb-3">Test Controls</h3>
        <div className="space-y-2">
          <button
            onClick={() => setCurrentPhase('lobby')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'lobby' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Lobby
          </button>
          <button
            onClick={() => setCurrentPhase('prompt')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'prompt' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Prompt
          </button>
          <button
            onClick={() => setCurrentPhase('choose')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'choose' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Voting
          </button>
          <button
            onClick={() => setCurrentPhase('reveal')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'reveal' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Reveal
          </button>
          <button
            onClick={() => setCurrentPhase('scoring')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'scoring' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Scoring
          </button>
          <button
            onClick={() => setCurrentPhase('over')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'over' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Game Over
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-600">
          <button
            onClick={resetGame}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset Game
          </button>
          {currentPhase === 'choose' && mockState.hasVoted && (
            <button
              onClick={() => setCurrentPhase('scoring')}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mt-2"
            >
              Proceed to Scoring
            </button>
          )}
          {currentPhase === 'scoring' && (
            <button
              onClick={nextRound}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors mt-2"
            >
              Next Round
            </button>
          )}
        </div>
      </div>



      {/* Main Content */}
      {renderCurrentPhase()}
    </div>
  );
}
