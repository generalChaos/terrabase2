'use client';
import { useState } from 'react';
import { GamePhaseManager } from '@/components/game-phase-manager';
import type { GamePhase } from '@party/types';

export default function GameDemoPage() {
  const [gameType, setGameType] = useState<
    'bluff-trivia' | 'word-association' | 'fibbing-it'
  >('fibbing-it');
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [isHost, setIsHost] = useState(true);

  // Mock data for bluff-trivia
  const bluffTriviaProps = {
    gameType,
    phase,
    isHost,
    question: 'What is the capital of France?',
    correctAnswer: 'Paris',
    timeLeft: 15,
    totalTime: 15,
    round: 1,
    maxRounds: 5,
    choices: [
      { id: 'TRUE::1', text: 'Paris', by: 'system' },
      { id: 'bluff1', text: 'London', by: 'player1' },
      { id: 'bluff2', text: 'Berlin', by: 'player2' },
    ],
    votes: [
      { voter: 'player1', choiceId: 'TRUE::1' },
      { voter: 'player2', choiceId: 'bluff1' },
    ],
    players: [
      {
        id: 'player1',
        name: 'Alice',
        avatar: '👩',
        score: 1000,
        connected: true,
      },
      { id: 'player2', name: 'Bob', avatar: '👨', score: 500, connected: true },
    ],
    scores: [
      { playerId: 'player1', score: 1000 },
      { playerId: 'player2', score: 500 },
    ],
    current: {
      correctAnswerPlayers: ['player1'],
    },
  };

  // Mock data for fibbing-it
  const fibbingItProps = {
    gameType,
    phase,
    isHost,
    question: 'The fear of spiders is known as...',
    correctAnswer: 'arachnophobia',
    timeLeft: 28,
    totalTime: 30,
    round: 1,
    maxRounds: 5,
    choices: [
      { id: 'TRUE::1', text: 'arachnophobia', by: 'system' },
      { id: 'bluff1', text: 'arachnophiba', by: 'player1' },
      { id: 'bluff2', text: 'arachnida', by: 'player2' },
      { id: 'bluff3', text: 'arahinnis othopax', by: 'player3' },
    ],
    votes: [
      { voter: 'player1', choiceId: 'TRUE::1' },
      { voter: 'player2', choiceId: 'bluff1' },
    ],
    players: [
      {
        id: 'player1',
        name: 'Carla',
        avatar: '👩',
        score: 9200,
        connected: true,
      },
      {
        id: 'player2',
        name: 'Thomas',
        avatar: '👨',
        score: 9200,
        connected: true,
      },
      {
        id: 'player3',
        name: 'Lauren',
        avatar: '👦',
        score: 7900,
        connected: true,
      },
      {
        id: 'player4',
        name: 'Alex',
        avatar: '👧',
        score: 6500,
        connected: true,
      },
    ],
    scores: [
      { playerId: 'player1', score: 9200 },
      { playerId: 'player2', score: 9200 },
      { playerId: 'player3', score: 7900 },
      { playerId: 'player4', score: 6500 },
    ],
    current: {
      correctAnswerPlayers: ['player1'],
    },
  };

  // Mock data for word-association
  const wordAssociationProps = {
    gameType,
    phase,
    isHost,
    word: 'Ocean',
    associations: [
      { id: 'assoc1', text: 'Blue', playerId: 'player1' },
      { id: 'assoc2', text: 'Waves', playerId: 'player2' },
      { id: 'assoc3', text: 'Fish', playerId: 'player3' },
    ],
    timeLeft: 15,
    totalTime: 15,
    round: 1,
    maxRounds: 5,
    players: [
      {
        id: 'player1',
        name: 'Alice',
        avatar: '👩',
        score: 100,
        connected: true,
      },
      { id: 'player2', name: 'Bob', avatar: '👨', score: 50, connected: true },
      {
        id: 'player3',
        name: 'Charlie',
        avatar: '👦',
        score: 75,
        connected: true,
      },
    ],
  };

  const getPropsForGame = () => {
    switch (gameType) {
      case 'bluff-trivia':
        return bluffTriviaProps;
      case 'word-association':
        return wordAssociationProps;
      case 'fibbing-it':
        return fibbingItProps;
      default:
        return fibbingItProps;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-600">
          <h1 className="text-3xl font-bold mb-4 text-white">
            🎮 Game Type Demo
          </h1>
          <p className="text-slate-300 mb-6">
            This page demonstrates how easy it is to switch between different
            game types using the new architecture. Change the game type below to
            see different UIs render automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Game Type
              </label>
              <select
                value={gameType}
                onChange={e =>
                  setGameType(
                    e.target.value as
                      | 'bluff-trivia'
                      | 'word-association'
                      | 'fibbing-it'
                  )
                }
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white"
              >
                <option value="bluff-trivia">Bluff Trivia</option>
                <option value="word-association">Word Association</option>
                <option value="fibbing-it">Fibbing It!</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Phase
              </label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as GamePhase)}
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white"
              >
                <option value="lobby">Lobby</option>
                <option value="prompt">Prompt</option>
                <option value="choose">Choose</option>
                <option value="scoring">Scoring</option>
                <option value="game_over">Game Over</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                View
              </label>
              <select
                value={isHost ? 'host' : 'player'}
                onChange={e => setIsHost(e.target.value === 'host')}
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white"
              >
                <option value="host">Host</option>
                <option value="player">Player</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            <strong>Current:</strong> {gameType} | {phase} |{' '}
            {isHost ? 'Host' : 'Player'} View
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-600 overflow-hidden">
          <GamePhaseManager {...getPropsForGame()} />
        </div>

        <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-600">
          <h2 className="text-xl font-semibold mb-4 text-white">
            How This Works
          </h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <strong>1. Game Type Routing:</strong> The main{' '}
              <code>GamePhaseManager</code> routes to game-specific managers
              based on the <code>gameType</code> prop.
            </p>
            <p>
              <strong>2. Game-Specific Logic:</strong> Each game has its own
              phase manager that handles the UI logic for that specific game.
            </p>
            <p>
              <strong>3. Common Interface:</strong> All games implement the same
              interface, making them interchangeable.
            </p>
            <p>
              <strong>4. Easy Extension:</strong> To add a new game, just create
              a new phase manager and add it to the router.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
