'use client';
import { useState, useEffect, useRef } from 'react';
import { SharedPromptView } from '@/components/games/fibbing-it/components';
import { LobbyView } from '@/components/games/shared/common-phases/lobby-view';
import { getAllGames } from '../../shared/config';
import { getTotalTimeForPhase } from '@/lib/game-timing';

type GamePhase = 'lobby' | 'prompt' | 'choose' | 'reveal' | 'scoring' | 'game-over';

export default function FibbingItTestPage() {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('lobby');
  const [mockState, setMockState] = useState({
    timeLeft: getTotalTimeForPhase('prompt'), // Use centralized timing
    totalTime: getTotalTimeForPhase('prompt'), // Use centralized timing
    round: 1,
    maxRounds: 5,
    question: "What's the most embarrassing thing that happened to you in school?",
    choices: [
      { id: '1', text: 'Tripped in front of the whole class', color: 'from-orange-500 to-orange-600', playerId: 'player1', playerAvatar: 'avatar_2' },
      { id: '2', text: 'Called the teacher "mom"', color: 'from-pink-500 to-pink-600', playerId: 'player2', playerAvatar: 'avatar_3' },
      { id: '3', text: 'Forgot to wear pants under my dress', color: 'from-teal-500 to-teal-600', playerId: 'player3', playerAvatar: 'avatar_4' },
      { id: '4', text: 'Farted during a test', color: 'from-green-600 to-green-700', playerId: 'host', playerAvatar: 'avatar_1' },
      { id: '5', text: 'Anonymous confession', color: 'from-indigo-500 to-indigo-600', playerId: 'anonymous', playerAvatar: undefined },
    ],
    votes: [
      { voter: 'player1', vote: '1' },
      { voter: 'player2', vote: '2' },
      { voter: 'player3', vote: '1' },
      { voter: 'player4', vote: '3' },
      { voter: 'host', vote: '4' },
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect - runs countdown when in timed phases
  useEffect(() => {
    console.log(`Timer effect triggered for phase: ${currentPhase}`);
    console.log(`Current mockState:`, mockState);
    
    if (currentPhase === 'prompt' || currentPhase === 'choose') {
      console.log(`Starting timer for phase: ${currentPhase}`);
      // Start timer countdown
      timerRef.current = setInterval(() => {
        console.log('Timer interval running...');
        setMockState(prev => {
          console.log(`Timer tick: ${prev.timeLeft}ms remaining`);
          if (prev.timeLeft <= 0) {
            // Time's up! Auto-advance to next phase
            if (currentPhase === 'prompt') {
              console.log('Time up for prompt, moving to choose');
              setCurrentPhase('choose');
              return { ...prev, timeLeft: getTotalTimeForPhase('choose'), totalTime: getTotalTimeForPhase('choose') }; // Use centralized timing
            } else if (currentPhase === 'choose') {
              console.log('Time up for choose, moving to reveal');
              setCurrentPhase('reveal');
              return { ...prev, timeLeft: getTotalTimeForPhase('reveal'), totalTime: getTotalTimeForPhase('reveal') }; // Use centralized timing
            }
            return prev;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1000 };
        });
      }, 1000);
    } else {
      console.log(`Clearing timer for phase: ${currentPhase}`);
      // Clear timer for non-timed phases
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup timer on unmount or phase change
    return () => {
      if (timerRef.current) {
        console.log('Cleaning up timer');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentPhase, mockState.timeLeft]);

  const handleStartGame = () => {
    setMockState(prev => ({ ...prev, timeLeft: getTotalTimeForPhase('prompt') })); // Use centralized timing
    setCurrentPhase('prompt');
  };

  const handleSubmitAnswer = (answer: string) => {
    console.log('Answer submitted:', answer);
    console.log('Current phase before submission:', currentPhase);
    
    setMockState(prev => {
      console.log('Updating state with answer submission');
      return { 
        ...prev, 
        hasSubmittedAnswer: true,
        timeLeft: getTotalTimeForPhase('choose'), // Use centralized timing
        totalTime: getTotalTimeForPhase('choose') // Use centralized timing
      };
    });
    
    // Move to voting phase immediately
    console.log('Moving to choose phase');
    setCurrentPhase('choose');
    console.log('Phase change initiated');
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
      timeLeft: getTotalTimeForPhase('prompt'), // Use centralized timing
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
        timeLeft: getTotalTimeForPhase('prompt'), // Use centralized timing
        totalTime: getTotalTimeForPhase('prompt'), // Use centralized timing
        question: "What's the weirdest food combination you actually enjoy?",
      }));
      setCurrentPhase('prompt');
    } else {
      setCurrentPhase('game-over');
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
        console.log('Rendering prompt phase:', {
          timeLeft: mockState.timeLeft,
          totalTime: mockState.totalTime,
          hasSubmitted: mockState.hasSubmittedAnswer,
          state: mockState.hasSubmittedAnswer ? 'waiting' : 'input'
        });
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}
            state={mockState.hasSubmittedAnswer ? 'waiting' : 'input'}
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
            votes={mockState.votes}
            players={mockState.players}
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
            votes={mockState.votes}
            players={mockState.players}
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
            state="scoring"
            options={mockState.choices}
            correctAnswer={mockState.correctAnswer}
            votes={mockState.votes}
            players={mockState.players}
            onSubmitVote={handleSubmitVote}
            selectedChoiceId={mockState.selectedChoiceId}
          />
        );

      case 'game-over':
        return (
          <SharedPromptView
            question={mockState.question}
            timeLeft={mockState.timeLeft}
            totalTime={mockState.totalTime}
            round={mockState.round}
            maxRounds={mockState.maxRounds}
            state="game-over"
            options={mockState.choices}
            votes={mockState.votes}
            players={mockState.players}
            onPlayAgain={resetGame}
          />
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
            onClick={() => setCurrentPhase('game-over')}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPhase === 'game-over' 
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
          
          {/* Debug Timer Button */}
          <button
            onClick={() => {
              console.log('Manual timer test clicked');
              console.log('Current state:', { currentPhase, timeLeft: mockState.timeLeft });
              setMockState(prev => ({ ...prev, timeLeft: prev.timeLeft - 5000 }));
            }}
            className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors mt-2"
          >
            Test Timer (-5s)
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
