'use client';
import { useEffect, useRef, useState } from 'react';
import { connectToRoom } from '@/lib/socket';
import { GamePhaseManager } from './game-phase-manager';
import {
  PlayerCreationForm,
  type PlayerCreationData,
} from './player-creation-form';
import type {
  RoomState,
  JoinRoomData,
  SubmitAnswerData,
  SubmitVoteData,
  Choice,
} from '../shared/types';
import { ErrorBoundary, useErrorBoundary } from '@/components/error-boundary';
import { getTotalTimeForPhase } from '@/lib/game-timing';

export function JoinClient({ code }: { code: string }) {
  const [joined, setJoined] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<
    Array<{ playerId: string; score: number }>
  >([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<
    string | undefined
  >();
  const [previousPhase, setPreviousPhase] = useState<string | null>(null);
  const [previousRound, setPreviousRound] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [playerId, setPlayerId] = useState<string>('');
  const [showPlayerCreation, setShowPlayerCreation] = useState(true);
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  // Use Error Boundary hook for manual error throwing
  const { throwError } = useErrorBoundary();

  // Use refs to avoid dependency issues in useEffect
  const playerIdRef = useRef(playerId);

  // Update refs when state changes
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  const handlePlayerCreation = async (data: PlayerCreationData) => {
    setShowPlayerCreation(false);

    try {
      console.log(`🎮 Attempting to join room: ${code}`);

      // Validate room code format
      if (!code || code.length !== 4) {
        setErr('Invalid room code. Room codes should be 4 characters long.');
        return;
      }

      // Try to connect to socket and join room
      const s = connectToRoom(code.toUpperCase());
      socketRef.current = s;

      // Set up a timeout to avoid getting stuck
      const joinTimeout = setTimeout(() => {
        if (!joined) {
          setErr(
            `Failed to join room ${code}. The room may not exist or the host may not be online.`
          );
        }
      }, 10000); // 10 second timeout

      s.on('connect', () => {
        console.log('✅ Connected to socket server');
        console.log('✅ Socket ID:', s.id);

        // Join the room with player data AFTER connection is established
        const joinData: JoinRoomData = {
          nickname: data.nickname,
          avatar: data.avatar,
        };

        console.log(
          '👋 Attempting to join room:',
          code,
          'with data:',
          joinData
        );
        s.emit('join', joinData);
        console.log('📤 Join event emitted');
      });

      s.on(
        'joined',
        (response: {
          roomCode?: string;
          playerId?: string;
          nickname?: string;
          isHost?: boolean;
        }) => {
          console.log(
            '✅ Successfully joined room:',
            code,
            'Response:',
            response
          );
          clearTimeout(joinTimeout);
          setJoined(true);
          setPlayerId(s.id || '');
        }
      );

      s.on(
        'connected',
        (response: { roomCode?: string; playerId?: string }) => {
          console.log('✅ Connected to room:', code, 'Response:', response);
        }
      );

      s.on(
        'reconnected',
        (response: { roomCode?: string; playerId?: string }) => {
          console.log('✅ Reconnected to room:', code, 'Response:', response);
        }
      );

      // Listen for errors and throw them to be caught by Error Boundary
      s.on('error', (error: unknown) => {
        console.error('❌ Socket error:', error);
        throwError(`WebSocket error: ${JSON.stringify(error)}`);
      });

      s.on('connect_error', (error: Error) => {
        console.error('❌ Connection error:', error);
        throwError(`Connection failed: ${error.message}`);
      });

      // Listen for room state updates
      s.on('room', (roomState: RoomState) => {
        console.log('🎮 Room state update:', roomState);
        
        // Extract choices from room state if available
        if (roomState.choices && Array.isArray(roomState.choices)) {
          console.log('🎲 Choices extracted from room state:', roomState.choices);
          setChoices(roomState.choices);
        }
        
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

      s.on('answerSubmitted', (data: { answerId: string; playerId: string }) => {
        console.log('✍️ Answer submitted:', data);
        // Server confirmed the answer submission
        // The local state is already set, so this is just confirmation
      });

      s.on('choices', (data: { choices: Choice[] }) => {
        console.log('🎲 Choices received:', data);
        setChoices(data.choices);
      });

      // Listen for reveal phase data
      s.on('reveal', (data: { 
        question: string; 
        correctAnswer: string; 
        choices: Choice[]; 
        votes: Array<{ voter: string; vote: string }> 
      }) => {
        console.log('🎭 Reveal phase data received:', data);
        // Store reveal data for the reveal phase component
        setRoomState(prev => prev ? { ...prev, revealData: data } : null);
      });

      s.on(
        'scores',
        (data: { totals: Array<{ playerId: string; score: number }> }) => {
          console.log('🏆 Scores received:', data);
          setScores(data.totals);
        }
      );

      s.on(
        'gameOver',
        (data: {
          winners: Array<{ id: string; name: string; score: number }>;
        }) => {
          console.log('🎉 Game over:', data);
        }
      );
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setShowPlayerCreation(true); // Show form again on error
    }
  };

  const handleSubmitAnswer = (answer: string) => {
    if (!socketRef.current) return;
    const submitData: SubmitAnswerData = { answer };
    console.log('📝 Submitting answer:', submitData);
    
    // Update local state immediately for better UX
    // setHasSubmittedAnswer(true); // This line is removed
    
    // Send to server
    socketRef.current.emit('submitAnswer', submitData);
  };

  const handleSubmitVote = (vote: string) => {
    if (!socketRef.current) return;
    const submitData: SubmitVoteData = { vote };
    console.log('🗳️ Submitting vote:', submitData);
    socketRef.current.emit('submitVote', submitData);
    // Set local state immediately for better UX
    // setHasVoted(true); // This line is removed
    setSelectedChoiceId(vote);
  };

  // Show player creation form first
    if (showPlayerCreation) {
    return (
      <ErrorBoundary>
        <PlayerCreationForm
          onSubmit={handlePlayerCreation}
          onCancel={() => window.history.back()}
          isHost={false}
        />
      </ErrorBoundary>
    );
  }

  // Show error state if there's an error
  if (err) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Connection Error
          </h2>
          <p className="text-slate-300 mb-4">{err}</p>
          <button
            onClick={() => {
              setErr(null);
              setShowPlayerCreation(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show game phase manager if we have room state and are joined
  if (
    roomState &&
    (joined || roomState.players?.some(p => p.id === playerId))
  ) {
    // Compute submission and voting state from game state
    // Use the structure that the backend actually sends (old structure)
    const hasSubmittedAnswer: boolean = 
      (roomState?.current?.bluffs?.some(
        (bluff: { by: string }) => bluff?.by === playerId
      )) ||
      (roomState?.current?.correctAnswerPlayers?.includes(playerId)) ||
      false;

    const hasVoted: boolean = 
      (roomState?.current?.votes?.some(
        (vote: { voter: string }) => vote?.voter === playerId
      )) ||
      false;

    const selectedChoiceId: string | undefined = 
      roomState?.current?.votes?.find(
        (vote: { voter: string; vote: string }) => vote?.voter === playerId
      )?.vote;

    // Debug logging for computed values
    console.log('🎮 JoinClient computed values:', {
      playerId,
      hasSubmittedAnswer,
      hasVoted,
      selectedChoiceId,
      bluffs: roomState?.current?.bluffs,
      correctAnswerPlayers: roomState?.current?.correctAnswerPlayers,
      votes: roomState?.current?.votes,
      phase: roomState?.phase,
      round: roomState?.round
    });

    return (
      <ErrorBoundary>
        <GamePhaseManager
          gameType={roomState.gameType || 'fibbing-it'}
          phase={roomState.phase || 'lobby'}
          isHost={false}
          roomCode={code}
          question={roomState.current?.prompt || ''}
          correctAnswer={roomState.current?.answer || ''}
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
      </ErrorBoundary>
    );
  }

  // This should never show now, but keeping as fallback
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-slate-300">Connecting to room {code}...</p>
        <p className="text-slate-500 text-sm mt-2">
          {!joined && 'Joining room...'}
          {joined && !roomState && 'Waiting for room data...'}
        </p>
      </div>
    </div>
  );
}
