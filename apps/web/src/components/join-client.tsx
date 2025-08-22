'use client';
import { useEffect, useRef, useState } from 'react';
import { connectToRoom } from '@/lib/socket';
import { notify } from '@/lib/notify';
import { GamePhaseManager } from './game-phase-manager';
import { RoomStateDebug } from './room-state-debug';
import { PlayerCreationForm, type PlayerCreationData } from './player-creation-form';
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
  const [showPlayerCreation, setShowPlayerCreation] = useState(true);
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  // Use refs to avoid dependency issues in useEffect
  const hasSubmittedAnswerRef = useRef(hasSubmittedAnswer);
  const playerIdRef = useRef(playerId);
  
  // Update refs when state changes
  useEffect(() => {
    hasSubmittedAnswerRef.current = hasSubmittedAnswer;
  }, [hasSubmittedAnswer]);
  
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  const handlePlayerCreation = async (data: PlayerCreationData) => {
    setNickname(data.nickname);
    setShowPlayerCreation(false);
    
    try {
      // Try to connect to socket and join room
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
      console.log('🏠 Current round:', roomState.current);
      console.log('🏠 Correct answer players:', roomState.current?.correctAnswerPlayers);
      console.log('🏠 Bluffs:', roomState.current?.bluffs);
      console.log('🏠 Current player ID:', playerIdRef.current);
      console.log('🏠 Has submitted answer before update:', hasSubmittedAnswerRef.current);
      
      // Handle phase changes
      if (previousPhase && previousPhase !== roomState.phase) {
        console.log(`🔄 Phase change: ${previousPhase} → ${roomState.phase}`);
        if (roomState.phase === 'prompt') {
          console.log('🔄 Checking if player has already submitted in current round');
          // Check if player has already submitted (either as a bluff or correct answer)
          const hasSubmittedInCurrentRound = roomState.current?.bluffs?.some(
            (bluff: { by: string }) => bluff.by === playerIdRef.current
          ) || roomState.current?.correctAnswerPlayers?.includes(playerIdRef.current);
          
          console.log('🔄 Has submitted in current round:', hasSubmittedInCurrentRound);
          console.log('🔄 Bluffs by current player:', roomState.current?.bluffs?.filter((b: { by: string }) => b.by === playerIdRef.current));
          console.log('🔄 Correct answer players:', roomState.current?.correctAnswerPlayers);
          
          if (!hasSubmittedInCurrentRound) {
            console.log('🔄 Resetting submission state - no submission found in current round');
            setHasSubmittedAnswer(false);
          } else {
            console.log('🔄 Keeping submission state - player already submitted in current round');
          }
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
      if (previousRound !== roomState.round && roomState.phase === 'prompt') {
        console.log(`🔄 New round started: ${previousRound} → ${roomState.round}`);
        setHasSubmittedAnswer(false);
        setHasVoted(false);
        setSelectedChoiceId(undefined);
      }
      
      setPreviousPhase(roomState.phase);
      setPreviousRound(roomState.round);
      setRoomState(roomState);
      setTimer(roomState.timeLeft || 0);
    });

    // Listen for timer updates
    s.on('timer', (data: { timeLeft: number }) => {
      console.log('⏰ Timer update:', data.timeLeft);
      setTimer(data.timeLeft);
    });

    // Listen for game events
    s.on('prompt', (data: { question: string }) => {
      console.log('🎯 Prompt received:', data);
    });

    s.on('choices', (data: { choices: Choice[] }) => {
      console.log('🎲 Choices received:', data);
      setChoices(data.choices);
    });

    s.on('scores', (data: { totals: Array<{ playerId: string; score: number }> }) => {
      console.log('🏆 Scores received:', data);
      setScores(data.totals);
    });

    s.on('gameOver', (data: { winners: Array<{ id: string; name: string; score: number }> }) => {
      console.log('🎉 Game over:', data);
    });

      // Join the room with player data
      const joinData: JoinRoomData = { 
        nickname: data.nickname, 
        avatar: data.avatar 
      };
      
      console.log('👋 Attempting to join room:', code, 'with data:', joinData);
      s.emit('join', joinData);
      console.log('📤 Join event emitted');
      
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setShowPlayerCreation(true); // Show form again on error
      setNickname('');
    }
  };

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
    // Set local state immediately for better UX
    setHasVoted(true);
    setSelectedChoiceId(choiceId);
  };

  // Show player creation form first
  if (showPlayerCreation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <PlayerCreationForm
          onSubmit={handlePlayerCreation}
          onCancel={() => window.history.back()}
          isHost={false}
          roomCode={code}
        />
      </div>
    );
  }

  // Show game phase manager if we have room state and are joined
  if (roomState && (joined || roomState.players?.some(p => p.id === playerId))) {
    // Get the correct total time for the current phase
    const getTotalTimeForPhase = (phase: string) => {
      switch (phase) {
        case 'prompt': return DUR.PROMPT;
        case 'choose': return DUR.CHOOSE;
        case 'scoring': return DUR.SCORING;
        default: return 30;
      }
    };

    return (
      <GamePhaseManager
        gameType={roomState.gameType || "fibbing-it"}
        phase={roomState.phase || "lobby"}
        isHost={false}
        roomCode={code}
        question={roomState.current?.prompt || ""}
        correctAnswer={roomState.current?.answer || ""}
        choices={choices}
        timeLeft={timer}
        totalTime={getTotalTimeForPhase(roomState.phase)}
        round={roomState.round || 0}
        maxRounds={roomState.maxRounds || 5}
        players={roomState.players || []}
        votes={roomState.current?.votes || []}
        scores={scores}
        playerId={playerId}
        current={roomState.current}
        onSubmitAnswer={handleSubmitAnswer}
        onSubmitVote={handleSubmitVote}
        hasSubmittedAnswer={hasSubmittedAnswer}
        hasVoted={hasVoted}
        selectedChoiceId={selectedChoiceId}
      />
    );
  }

  // This should never show now, but keeping as fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-slate-400">
        <p>Connecting to room...</p>
      </div>
    </div>
  );
}
