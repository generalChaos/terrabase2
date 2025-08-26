'use client';
import { useState } from 'react';
import { 
  FibbingItPromptView,
  FibbingItVotingView,
  FibbingItScoringView,
  FibbingItRevealView,
  FibbingItGameOverView
} from '../../components/games/fibbing-it/shared';

export default function LayoutTestPage() {
  const [currentPhase, setCurrentPhase] = useState<'prompt' | 'choose' | 'scoring' | 'reveal' | 'game-over'>('prompt');
  const [isPlayer, setIsPlayer] = useState(false);
  const [isHost, setIsHost] = useState(true);

  const mockData = {
    question: "What's the most embarrassing thing that happened to you in school?",
    choices: [
      { id: '1', text: 'Tripped in front of the whole class', by: 'player1' },
      { id: '2', text: 'Called the teacher "mom"', by: 'player2' },
      { id: '3', text: 'Forgot to wear pants under my dress', by: 'player3' },
      { id: '4', text: 'Farted during a test', by: 'host' },
    ],
    correctAnswer: "Called the teacher \"mom\"",
    timeLeft: 25000,
    totalTime: 25000,
    round: 1,
    maxRounds: 5,
    roomCode: 'TEST1',
    votes: [
      { voter: 'player1', choiceId: '2' },
      { voter: 'player2', choiceId: '1' },
      { voter: 'player3', choiceId: '2' },
      { voter: 'host', choiceId: '2' },
    ],
    players: [
      { id: 'player1', name: 'Alice', avatar: 'avatar_1', score: 1200, connected: true },
      { id: 'player2', name: 'Bob', avatar: 'avatar_2', score: 800, connected: true },
      { id: 'player3', name: 'Charlie', avatar: 'avatar_3', score: 1500, connected: true },
      { id: 'host', name: 'Host', avatar: 'avatar_4', score: 900, connected: true },
    ],
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 'prompt':
        return (
          <FibbingItPromptView
            question={mockData.question}
            timeLeft={mockData.timeLeft}
            totalTime={mockData.totalTime}
            round={mockData.round}
            maxRounds={mockData.maxRounds}
            roomCode={mockData.roomCode}
            isPlayer={isPlayer}
            isHost={isHost}
            onSubmitAnswer={(answer) => console.log('Answer submitted:', answer)}
            hasSubmitted={false}
          />
        );
      
      case 'choose':
        return (
          <FibbingItVotingView
            question={mockData.question}
            choices={mockData.choices}
            timeLeft={mockData.timeLeft}
            totalTime={mockData.totalTime}
            round={mockData.round}
            maxRounds={mockData.maxRounds}
            roomCode={mockData.roomCode}
            votes={mockData.votes}
            players={mockData.players}
            onSubmitVote={(choiceId) => console.log('Vote submitted:', choiceId)}
            hasVoted={false}
            selectedChoiceId={undefined}
            gotAnswerCorrect={false}
            isPlayer={isPlayer}
            isHost={isHost}
          />
        );
      
      case 'scoring':
        return (
          <FibbingItScoringView
            question={mockData.question}
            choices={mockData.choices}
            correctAnswer={mockData.correctAnswer}
            timeLeft={mockData.timeLeft}
            totalTime={mockData.totalTime}
            round={mockData.round}
            maxRounds={mockData.maxRounds}
            roomCode={mockData.roomCode}
            votes={mockData.votes}
            players={mockData.players}
            isPlayer={isPlayer}
            isHost={isHost}
          />
        );
      
      case 'reveal':
        return (
          <FibbingItRevealView
            question={mockData.question}
            choices={mockData.choices}
            correctAnswer={mockData.correctAnswer}
            timeLeft={mockData.timeLeft}
            roomCode={mockData.roomCode}
            votes={mockData.votes}
            players={mockData.players}
            isPlayer={isPlayer}
            isHost={isHost}
          />
        );
      
      case 'game-over':
        return (
          <FibbingItGameOverView
            timeLeft={mockData.timeLeft}
            roomCode={mockData.roomCode}
            players={mockData.players}
            onPlayAgain={() => console.log('Play again clicked')}
            isPlayer={isPlayer}
            isHost={isHost}
          />
        );
      
      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation Controls */}
      <div className="fixed top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/50">
        <h3 className="text-lg font-bold text-white mb-3">Layout Test Controls</h3>
        
        {/* Phase Selection */}
        <div className="space-y-2 mb-4">
          <div className="text-sm text-slate-300 mb-2">Phase:</div>
          {(['prompt', 'choose', 'scoring', 'reveal', 'game-over'] as const).map((phase) => (
            <button
              key={phase}
              onClick={() => setCurrentPhase(phase)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPhase === phase 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="space-y-2">
          <div className="text-sm text-slate-300 mb-2">View Mode:</div>
          <button
            onClick={() => { setIsPlayer(true); setIsHost(false); }}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPlayer && !isHost
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Player View
          </button>
          <button
            onClick={() => { setIsPlayer(false); setIsHost(true); }}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isPlayer && isHost
                ? 'bg-purple-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Host View
          </button>
        </div>
      </div>

      {/* Back to Home */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-slate-800/90 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-600/50 text-white hover:bg-slate-700/90 transition-colors"
        >
          ← Back to Home
        </button>
      </div>

      {/* Phase Display */}
      <div className="pt-20">
        {renderPhase()}
      </div>
    </div>
  );
}
