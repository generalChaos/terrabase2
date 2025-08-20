"use client";
import { useState, useEffect } from "react";
import { GamePhaseManager } from "@/components/game-phase-manager";
import type { Choice } from "@party/types";
import { DUR } from "@party/types";

export default function TestPromptPage() {
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState<'prompt' | 'choose' | 'scoring'>('prompt');
  const [isHost, setIsHost] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<Array<{ playerId: string; score: number }>>([
    { playerId: '1', score: 1500 },
    { playerId: '2', score: 1000 },
  ]);

  // Simulate countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          // Switch phases when timer runs out
          if (phase === 'prompt') {
            setPhase('choose');
            setTimeLeft(20);
            // Simulate choices being received
            setChoices([
              { id: 'TRUE::p1', by: 'server', text: 'Unicorn' },
              { id: 'bluff1', by: '1', text: 'Lion' },
              { id: 'bluff2', by: '2', text: 'Dragon' },
            ]);
          } else if (phase === 'choose') {
            setPhase('scoring');
            setTimeLeft(6);
          } else {
            setPhase('prompt');
            setTimeLeft(30);
            setChoices([]);
          }
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleSubmitAnswer = (answer: string) => {
    console.log("Submitted answer:", answer);
    setHasSubmitted(true);
  };

  const handleSubmitVote = (choiceId: string) => {
    console.log("Submitted vote:", choiceId);
    setHasVoted(true);
  };

  const resetGame = () => {
    setTimeLeft(30);
    setPhase('prompt');
    setHasSubmitted(false);
    setHasVoted(false);
    setChoices([]);
    setScores([
      { playerId: '1', score: 1500 },
      { playerId: '2', score: 1000 },
    ]);
  };

  const switchPhase = () => {
    if (phase === 'prompt') {
      setPhase('choose');
      setTimeLeft(20);
      setChoices([
        { id: 'TRUE::p1', by: 'server', text: 'Unicorn' },
        { id: 'bluff1', by: '1', text: 'Lion' },
        { id: 'bluff2', by: '2', text: 'Dragon' },
      ]);
    } else if (phase === 'choose') {
      setPhase('scoring');
      setTimeLeft(6);
    } else {
      setPhase('prompt');
      setTimeLeft(30);
      setChoices([]);
    }
  };

  return (
    <div className="min-h-screen bg-[--bg] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex gap-4 items-center flex-wrap">
          <h1 className="text-3xl font-bold">Game Phase Test</h1>
          <button
            onClick={() => setIsHost(!isHost)}
            className="px-4 py-2 bg-[--accent] text-black rounded-lg"
          >
            Switch to {isHost ? "Player" : "Host"} View
          </button>
          <button
            onClick={switchPhase}
            className="px-4 py-2 bg-[--warning] text-black rounded-lg"
          >
            Switch to {phase === 'prompt' ? 'Voting' : phase === 'choose' ? 'Scoring' : 'Prompt'} Phase
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-[--danger] text-black rounded-lg"
          >
            Reset Game
          </button>
        </div>

        <div className="mb-4 text-center">
          <p className="text-[--muted]">
            Phase: {phase} | Time Left: {timeLeft}s | View: {isHost ? "Host" : "Player"} | 
            {phase === 'prompt' ? (hasSubmitted ? " Answer Submitted" : " Answer Not Submitted") : 
             (hasVoted ? " Vote Submitted" : " Vote Not Submitted")}
          </p>
        </div>

        <GamePhaseManager
          phase={phase}
          isHost={isHost}
          question="What is the national animal of Scotland?"
          correctAnswer="Unicorn"
          timeLeft={timeLeft}
          totalTime={phase === 'prompt' ? DUR.PROMPT : phase === 'choose' ? DUR.CHOOSE : DUR.SCORING}
          round={1}
          maxRounds={5}
          choices={choices}
          votes={[
            { voter: '1', choiceId: 'TRUE::p1' },
            { voter: '2', choiceId: 'bluff1' },
          ]}
          players={[
            { id: '1', name: 'Player 1', avatar: '🙂', score: 1500 },
            { id: '2', name: 'Player 2', avatar: '😊', score: 1000 },
          ]}
          scores={scores}
          playerId="1"
          onSubmitAnswer={handleSubmitAnswer}
          onSubmitVote={handleSubmitVote}
          hasSubmittedAnswer={hasSubmitted}
          hasVoted={hasVoted}
        />
      </div>
    </div>
  );
}
