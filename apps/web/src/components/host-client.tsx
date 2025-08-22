"use client";
import { useEffect, useRef, useState } from "react";
import { connectToRoom } from "@/lib/socket";
import { AppShell } from "@/components/app-shell";
import { RoomCodeChip } from "@/components/games/shared/ui";
import { PlayerAvatar } from "@/components/games/shared/ui";
import { GamePhaseManager } from "./game-phase-manager";
import { RoomStateDebug } from "./room-state-debug";
import { PlayerCreationForm, type PlayerCreationData } from "./player-creation-form";
import type { RoomState, Choice } from "@party/types";
import { DUR } from "@party/types";

export function HostClient({ code }: { code: string }) {
  const [state, setState] = useState<RoomState | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<Array<{ playerId: string; score: number }>>([]);
  const [timer, setTimer] = useState<number>(0);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerCreationData | null>(null);
  const [showPlayerCreation, setShowPlayerCreation] = useState(true);
  const [roomCode, setRoomCode] = useState<string>(code);
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  // Available games data with themes
  const availableGames = [
    {
      id: "fibbing-it",
      title: "Fibbing It!",
      description: "Players create answers and vote on the best ones. Can you spot the truth from the lies?",
      players: "3-8 players",
      duration: "15-30 min",
      difficulty: "Easy",
      icon: "🎭",
      theme: {
        primary: "bg-purple-600",
        accent: "bg-purple-400",
        background: "bg-purple-800",
        icon: "🎭",
        name: "Fibbing It!"
      }
    },
    {
      id: "bluff-trivia",
      title: "Bluff Trivia",
      description: "Classic trivia with bluffing mechanics. Make up answers and see if others believe you!",
      players: "3-8 players",
      duration: "20-40 min",
      difficulty: "Medium",
      icon: "🧠",
      theme: {
        primary: "bg-blue-600",
        accent: "bg-blue-400",
        background: "bg-blue-800",
        icon: "🧠",
        name: "Bluff Trivia"
      }
    },
    {
      id: "word-association",
      title: "Word Association",
      description: "Create word associations and vote on the most creative ones. Simple but endlessly fun!",
      players: "3-8 players",
      duration: "15-25 min",
      difficulty: "Easy",
      icon: "🔗",
      theme: {
        primary: "bg-teal-600",
        accent: "bg-teal-400",
        background: "bg-teal-800",
        icon: "🔗",
        name: "Word Association"
      }
    }
  ];

  // Pre-select game based on URL or room state
  useEffect(() => {
    if (state?.gameType && !selectedGame) {
      setSelectedGame(state.gameType);
    }
  }, [state?.gameType, selectedGame]);

  const handlePlayerCreation = async (data: PlayerCreationData) => {
    setPlayerData(data);
    setShowPlayerCreation(false);
    
    try {
      // First, create the room via API
      console.log("🏗️ Creating room via API...");
      const response = await fetch('http://localhost:3001/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameType: 'fibbing-it' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const roomData = await response.json();
      console.log("✅ Room created:", roomData);
      
      // Update the room code to the created one
      setRoomCode(roomData.code);
      
      // Now connect to socket and join the created room
      const s = connectToRoom(roomData.code);
      socketRef.current = s;
      
      // Host must join the room to control the game
      s.on("connect", () => {
        console.log("🔌 Host connected, joining room as player...");
        console.log("🔌 Host socket ID:", s.id);
        s.emit("join", { 
          nickname: data.nickname, 
          avatar: data.avatar 
        });
      });
      
      // Listen for join confirmation
      s.on("joined", (data: { ok: boolean }) => {
        console.log("✅ Host successfully joined room:", data);
      });
      
      // Listen for join errors
      s.on("error", (error: Error) => {
        console.error("❌ Host join error:", error);
      });
      
      // Listen for room state updates
      s.on("room", (st: RoomState) => {
        console.log("🏠 Room state updated:", st);
        console.log("🏠 Players:", st.players);
        console.log("🏠 Host ID:", st.hostId);
        console.log("🏠 Current socket ID:", s.id);
        console.log("🏠 Phase changed from:", state?.phase, "to:", st.phase);
        setState(st);
        setTimer(st.timeLeft || 0);
      });

      // Debug: Listen for all events
      s.onAny((eventName, ...args) => {
        console.log("🔍 Socket event received:", eventName, args);
      });
      
      // Listen for timer updates
      s.on("timer", (data: { timeLeft: number }) => {
        console.log("⏰ Timer update:", data.timeLeft);
        setTimer(data.timeLeft);
      });
      
      // Listen for game events
      s.on("prompt", (data: { question: string }) => {
        console.log("🎯 Prompt received:", data);
      });
      
      s.on("choices", (data: { choices: Choice[] }) => {
        console.log("🎲 Choices received:", data);
        setChoices(data.choices);
      });
      
      s.on("scores", (data: { totals: Array<{ playerId: string; score: number }> }) => {
        console.log("🏆 Scores received:", data);
        setScores(data.totals);
      });
      
      s.on("gameOver", (data: { winners: Array<{ id: string; name: string; score: number }> }) => {
        console.log("🎉 Game over:", data);
      });
      
    } catch (error) {
      console.error("❌ Failed to create room:", error);
      setShowPlayerCreation(true); // Show form again on error
      setPlayerData(null);
    }
  };

  const start = () => {
    if (!selectedGame) {
      console.log("❌ No game selected");
      return;
    }
    console.log("🎮 Starting game:", selectedGame);
    socketRef.current?.emit("startGame", { gameType: selectedGame });
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setShowAllGames(false); // Close the expanded list
    console.log("🎯 Game selected:", gameId);
  };

  const toggleGameSelection = () => {
    setShowAllGames(!showAllGames);
  };

  // Show player creation form first
  if (showPlayerCreation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <PlayerCreationForm
          onSubmit={handlePlayerCreation}
          onCancel={() => window.history.back()}
          isHost={true}
          roomCode={roomCode}
        />
      </div>
    );
  }

  return (
    <>
      <AppShell
        title="Host Lobby"
        right={<RoomCodeChip code={roomCode} />}
        sub={<span>Ask friends to go to <span className="font-mono">/join/{roomCode}</span> or scan the QR.</span>}
      >
        {/* Debug info */}
        {state && (
          <div className="mb-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="text-sm text-slate-300">
              <strong>Debug:</strong> Phase: <span className="text-teal-400">{state.phase}</span> | 
              Game: <span className="text-teal-400">{state.gameType}</span> | 
              Players: <span className="text-teal-400">{state.players?.length || 0}</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              <button 
                onClick={() => console.log('Current state:', state)}
                className="px-2 py-1 bg-slate-700 rounded text-xs"
              >
                Log State
              </button>
            </div>
          </div>
        )}
        {state ? (
          <>
            {console.log('🏠 HostClient rendering GamePhaseManager with state:', state)}
            <GamePhaseManager
              gameType={state.gameType || selectedGame || "fibbing-it"}
              phase={state.phase || "lobby"}
              isHost={true}
              roomCode={roomCode}
              question={state.current?.prompt}
              correctAnswer={state.current?.answer}
              timeLeft={timer}
              totalTime={(() => {
                switch (state.phase) {
                  case 'prompt': return DUR.PROMPT;
                  case 'choose': return DUR.CHOOSE;
                  case 'scoring': return DUR.SCORING;
                  default: return 30;
                }
              })()}
              round={state.round || 1}
              maxRounds={state.maxRounds || 5}
              choices={choices}
              votes={state.current?.votes || []}
              players={state.players || []}
              scores={scores}
              onStartGame={start}
              selectedGame={selectedGame ? availableGames.find(g => g.id === selectedGame) : undefined}
              onGameSelect={(gameId) => {
                if (gameId === 'toggle') {
                  toggleGameSelection();
                } else {
                  handleGameSelect(gameId);
                }
              }}
              availableGames={availableGames}
              showAllGames={showAllGames}
            />
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-slate-300">Connecting to room...</p>
            </div>
          </div>
        )}
      </AppShell>
      <RoomStateDebug roomState={state} />
    </>
  );
}
