'use client';
import { useEffect, useRef, useState } from 'react';
import { connectToRoom } from '@/lib/socket';
import { notify } from '@/lib/notify';
import { GamePhaseManager } from './game-phase-manager';
import { RoomStateDebug } from './room-state-debug';
import type { RoomState, JoinRoomData, SubmitAnswerData, SubmitVoteData, Choice } from '@party/types';
import { DUR } from '@party/types';

export function JoinClient({ code }: { code: string }) {
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<Array<{ playerId: string; score: number }>>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | undefined>();
  const [previousPhase, setPreviousPhase] = useState<string | null>(null);
  const [previousRound, setPreviousRound] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [playerId, setPlayerId] = useState<string>("");
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  useEffect(() => {
    const s = connectToRoom(code);
    socketRef.current = s;
    
    console.log('🔌 Setting up socket listeners for room:', code);
    
    s.on('connect', () => {
      console.log('✅ Connected to socket server');
      console.log('✅ Socket ID:', s.id);
    });
    
    s.on('joined', () => {
      console.log('✅ Successfully joined room:', code);
      setJoined(true);
      setPlayerId(s.id || "");
    });
    
    s.on('error', (e: { msg?: string }) => {
      console.log('❌ Socket error:', e);
      setErr(e?.msg ?? 'ERROR');
    });
    
    s.on('room', (roomState: RoomState) => {
      console.log('🏠 Room state updated:', roomState);
      console.log('🏠 Players:', roomState.players);
      console.log('🏠 Host ID:', roomState.hostId);
      console.log('🏠 Current socket ID:', s.id);
      console.log('🏠 Current joined status:', joined);
      console.log('🏠 Room phase:', roomState.phase);
      
      // Check if we're entering a new phase
      const isNewPhase = previousPhase !== null && previousPhase !== roomState.phase;
      
      if (isNewPhase) {
        console.log(`🔄 Phase change: ${previousPhase} → ${roomState.phase}`);
        if (roomState.phase === 'prompt') {
          console.log('🔄 Resetting submission state for new prompt phase');
          setHasSubmittedAnswer(false);
          setHasVoted(false);
          setSelectedChoiceId(undefined);
        } else if (roomState.phase === 'choose') {
          console.log('🔄 Resetting voting state for choose phase');
          setHasVoted(false);
          setSelectedChoiceId(undefined);
          // Keep answer submitted when moving to voting phase
        }
      }
      
      // Also reset submission state when entering a new prompt round
      if (roomState.phase === 'prompt' && roomState.round && 
          roomState.round !== previousRound) {
        console.log(`🔄 New prompt round started: ${roomState.round}`);
        setHasSubmittedAnswer(false);
        setSelectedChoiceId(undefined);
        setPreviousRound(roomState.round);
      }
      
      setPreviousPhase(roomState.phase);
      setRoomState(roomState);
      setTimer(roomState.timeLeft || 0);
      
      // If we received a room state for an active game but we're not joined yet,
      // this might be a race condition - log it for debugging
      if (!joined && roomState.phase !== 'lobby') {
        console.log('⚠️ Received active game state before join confirmation');
      }
    });

    s.on('timer', (data: { timeLeft: number }) => {
      console.log('⏰ Timer update:', data.timeLeft);
      setTimer(data.timeLeft);
    });

    s.on('choices', (data: { choices: Choice[] }) => {
      console.log('🎲 Choices received:', data);
      setChoices(data.choices);
      setHasVoted(false);
      setSelectedChoiceId(undefined);
    });

    s.on('submitted', (data: { kind: string }) => {
      console.log('✅ Action submitted:', data);
      if (data.kind === 'answer') {
        console.log('📝 Setting hasSubmittedAnswer to true');
        setHasSubmittedAnswer(true);
        notify.success('Answer submitted successfully!');
      } else if (data.kind === 'vote') {
        console.log('🗳️ Setting hasVoted to true');
        setHasVoted(true);
        notify.success('Vote submitted successfully!');
      }
    });

    s.on('scores', (data: { totals: Array<{ playerId: string; score: number }> }) => {
      console.log('🏆 Scores received:', data);
      setScores(data.totals);
    });
    
    s.on('connect_error', (error: Error) => {
      console.log('❌ Connection error:', error);
      console.log('❌ Error details:', error.message);
      setErr('Failed to connect to server');
    });
    
    s.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });
    
    return () => {
      console.log('🔌 Disconnecting socket from room:', code);
      s.disconnect();
      socketRef.current = null;
    };
  }, [socketRef, code, previousPhase, previousRound, joined]);

  function submit() {
    const trimmedNickname = nickname.trim();
    
    if (!trimmedNickname) {
      notify.error('Please enter a nickname');
      return;
    }
    
    if (!socketRef.current) {
      notify.error('Socket not connected');
      return;
    }
    
    console.log('🔘 Submit button clicked');
    console.log('🔘 Socket connected:', socketRef.current.connected);
    console.log('🔘 Socket ID:', socketRef.current.id);
    
    const joinData: JoinRoomData = { 
      nickname: trimmedNickname, 
      avatar: '🙂' 
    };
    
    console.log('👋 Attempting to join room:', code, 'with data:', joinData);
    socketRef.current.emit('join', joinData);
    console.log('📤 Join event emitted');
  }

  const handleSubmitAnswer = (answer: string) => {
    if (!socketRef.current) return;
    const submitData: SubmitAnswerData = { answer };
    console.log('📝 Submitting answer:', submitData);
    socketRef.current.emit('submitAnswer', submitData);
    // Don't set hasSubmittedAnswer here - wait for server confirmation
  };

  const handleSubmitVote = (choiceId: string) => {
    if (!socketRef.current) return;
    const submitData: SubmitVoteData = { choiceId };
    console.log('🗳️ Submitting vote:', submitData);
    socketRef.current.emit('submitVote', submitData);
    // Don't set hasVoted here - wait for server confirmation
  };

  // Show game phase manager if in a game phase
  if (roomState?.phase && roomState.phase !== 'lobby' && (joined || roomState.players?.some(p => p.id === playerId))) {
    return (
      <GamePhaseManager
        phase={roomState.phase}
        isHost={false}
        question={roomState.current?.question || ""}
        correctAnswer={roomState.current?.answer || ""}
        choices={choices}
        timeLeft={timer}
        totalTime={DUR.PROMPT}
        round={roomState.round || 0}
        maxRounds={roomState.maxRounds || 5}
        players={roomState.players || []}
        votes={roomState.current?.votes || []}
        scores={scores}
        playerId={playerId}
        onSubmitAnswer={handleSubmitAnswer}
        onSubmitVote={handleSubmitVote}
        hasSubmittedAnswer={hasSubmittedAnswer}
        hasVoted={hasVoted}
        selectedChoiceId={selectedChoiceId}
      />
    );
  }

  // Show lobby/join form
  return (
    <div className="min-h-screen bg-[--bg] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-4xl h1">Fibbing It!</div>
          <div className="mt-2 opacity-80">Joining room <span className="font-mono">{code}</span></div>
        </div>
        
        {!joined ? (
          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium mb-2">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--bg] text-[--fg] placeholder-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent"
                maxLength={20}
              />
              {err && <div className="mt-2 text-sm text-danger">{err}</div>}
            </div>
            
            <button 
              onClick={submit} 
              className="mt-4 h-12 w-full rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all"
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-panel border border-slate-800 p-6 text-center">
            <div className="text-2xl">✅ Joined!</div>
            <div className="opacity-80 mt-1">Waiting for the host to start…</div>
            {roomState && (
              <div className="mt-2 text-sm text-[--muted]">
                Room phase: {roomState.phase} | Players: {roomState.players?.length || 0}
              </div>
            )}
          </div>
        )}
        
        <RoomStateDebug 
          roomState={roomState} 
          hasSubmittedAnswer={hasSubmittedAnswer}
          hasVoted={hasVoted}
        />
      </div>
    </div>
  );
}
