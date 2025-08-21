"use client";
import { useEffect, useRef, useState } from "react";
import { connectToRoom } from "@/lib/socket";
import { AppShell } from "@/components/app-shell";
import { RoomCodeChip } from "@/components/room-code-chip";
import { PlayerAvatar } from "@/components/player-avatar";
import { GamePhaseManager } from "./game-phase-manager";
import { RoomStateDebug } from "./room-state-debug";
import type { RoomState, GameAction, Choice } from "@party/types";
import { DUR } from "@party/types";

export function HostClient({ code }: { code: string }) {
  const [state, setState] = useState<RoomState | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<Array<{ playerId: string; score: number }>>([]);
  const [timer, setTimer] = useState<number>(0);
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  useEffect(() => {
    const s = connectToRoom(code);
    socketRef.current = s;
    
    // Host must join the room to control the game
    s.on("connect", () => {
      console.log("🔌 Host connected, joining room as player...");
      console.log("🔌 Host socket ID:", s.id);
      s.emit("join", { nickname: "Host", avatar: "👑" });
    });
    
    // Listen for join confirmation
    s.on("joined", (data: { ok: boolean }) => {
      console.log("✅ Host successfully joined room:", data);
    });
    
    // Listen for join errors
    s.on("error", (error: any) => {
      console.error("❌ Host join error:", error);
    });
    
    // Listen for room state updates
    s.on("room", (st: RoomState) => {
      console.log("🏠 Room state updated:", st);
      console.log("🏠 Players:", st.players);
      console.log("🏠 Host ID:", st.hostId);
      console.log("🏠 Current socket ID:", s.id);
      setState(st);
      setTimer(st.timeLeft || 0);
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
    
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [code]);

  const start = () => {
    console.log("🎮 Starting game...");
    socketRef.current?.emit("startGame");
  };

  return (
    <>
      <AppShell
        title="Host Lobby"
        right={<RoomCodeChip code={code} />}
        sub={<span>Ask friends to go to <span className="font-mono">/join/{code}</span> or scan the QR.</span>}
      >
        {state?.phase && state.phase !== 'lobby' ? (
          <GamePhaseManager
            phase={state.phase}
            isHost={true}
            question={state.current?.prompt}
            correctAnswer={state.current?.answer}
            timeLeft={timer}
            totalTime={state.phase === 'prompt' ? DUR.PROMPT : state.phase === 'choose' ? DUR.CHOOSE : DUR.SCORING}
            round={state.round || 1}
            maxRounds={state.maxRounds || 5}
            choices={choices}
            votes={state.current?.votes || []}
            players={state.players || []}
            scores={scores}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Players</h2>
              <button onClick={start} className="h-11 px-6 rounded-xl bg-[--accent] text-black font-medium">
                Start Game
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {state?.players?.length
                ? state.players.map((p, index) => (
                    <PlayerAvatar 
                      key={`${p.id}-${p.name}-${index}`} 
                      {...p} 
                    />
                  ))
                : Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-[--panel] border border-dashed border-slate-700 p-4 opacity-70">
                      Waiting…
                    </div>
                  ))}
            </div>
          </>
        )}
      </AppShell>
      <RoomStateDebug roomState={state} />
    </>
  );
}
