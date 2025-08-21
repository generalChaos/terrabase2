"use client";
import { useState } from "react";
import { GamePhaseManager } from "@/components/game-phase-manager";
import type { Phase } from "@party/types";

export default function GameDemoPage() {
  const [gameType, setGameType] = useState<'bluff-trivia' | 'word-association'>('bluff-trivia');
  const [phase, setPhase] = useState<Phase>('prompt');
  const [isHost, setIsHost] = useState(true);

  // Mock data for bluff-trivia
  const bluffTriviaProps = {
    gameType,
    phase,
    isHost,
    question: "What is the capital of France?",
    correctAnswer: "Paris",
    timeLeft: 15,
    totalTime: 15,
    round: 1,
    maxRounds: 5,
    choices: [
      { id: "TRUE::1", text: "Paris", by: "system" },
      { id: "bluff1", text: "London", by: "player1" },
      { id: "bluff2", text: "Berlin", by: "player2" },
    ],
    votes: [
      { voter: "player1", choiceId: "TRUE::1" },
      { voter: "player2", choiceId: "bluff1" },
    ],
    players: [
      { id: "player1", name: "Alice", avatar: "👩", score: 1000, connected: true },
      { id: "player2", name: "Bob", avatar: "👨", score: 500, connected: true },
    ],
    scores: [
      { playerId: "player1", score: 1000 },
      { playerId: "player2", score: 500 },
    ],
    current: {
      correctAnswerPlayers: ["player1"]
    }
  };

  // Mock data for word-association
  const wordAssociationProps = {
    gameType,
    phase,
    isHost,
    word: "Ocean",
    associations: [
      { id: "assoc1", text: "Blue", playerId: "player1" },
      { id: "assoc2", text: "Waves", playerId: "player2" },
      { id: "assoc3", text: "Fish", playerId: "player3" },
    ],
    timeLeft: 15,
    totalTime: 15,
    round: 1,
    maxRounds: 5,
    players: [
      { id: "player1", name: "Alice", avatar: "👩", score: 100, connected: true },
      { id: "player2", name: "Bob", avatar: "👨", score: 50, connected: true },
      { id: "player3", name: "Charlie", avatar: "👦", score: 75, connected: true },
    ]
  };

  const getPropsForGame = () => {
    switch (gameType) {
      case 'bluff-trivia':
        return bluffTriviaProps;
      case 'word-association':
        return wordAssociationProps;
      default:
        return bluffTriviaProps;
    }
  };

  return (
    <div className="min-h-screen bg-[--bg] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-[--panel] rounded-2xl border border-[--border]">
          <h1 className="text-3xl font-bold mb-4">🎮 Game Type Demo</h1>
          <p className="text-[--muted] mb-6">
            This page demonstrates how easy it is to switch between different game types using the new architecture.
            Change the game type below to see different UIs render automatically.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Game Type</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value as 'bluff-trivia' | 'word-association')}
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--bg] text-[--fg]"
              >
                <option value="bluff-trivia">Bluff Trivia</option>
                <option value="word-association">Word Association</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as Phase)}
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--bg] text-[--fg]"
              >
                <option value="prompt">Prompt</option>
                <option value="choose">Choose</option>
                <option value="scoring">Scoring</option>
                <option value="over">Over</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">View</label>
              <select
                value={isHost ? 'host' : 'player'}
                onChange={(e) => setIsHost(e.target.value === 'host')}
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--bg] text-[--fg]"
              >
                <option value="host">Host</option>
                <option value="player">Player</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-[--muted]">
            <strong>Current:</strong> {gameType} | {phase} | {isHost ? 'Host' : 'Player'} View
          </div>
        </div>

        <div className="bg-[--panel] rounded-2xl border border-[--border] overflow-hidden">
          <GamePhaseManager {...getPropsForGame()} />
        </div>

        <div className="mt-8 p-6 bg-[--panel] rounded-2xl border border-[--border]">
          <h2 className="text-xl font-semibold mb-4">How This Works</h2>
          <div className="space-y-3 text-sm text-[--muted]">
            <p>
              <strong>1. Game Type Routing:</strong> The main <code>GamePhaseManager</code> routes to game-specific managers based on the <code>gameType</code> prop.
            </p>
            <p>
              <strong>2. Game-Specific Logic:</strong> Each game has its own phase manager that handles the UI logic for that specific game.
            </p>
            <p>
              <strong>3. Common Interface:</strong> All games implement the same interface, making them interchangeable.
            </p>
            <p>
              <strong>4. Easy Extension:</strong> To add a new game, just create a new phase manager and add it to the router.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
