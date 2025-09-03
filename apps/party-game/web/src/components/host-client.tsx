'use client';
import { useEffect, useRef, useState } from 'react';
import { connectToRoom } from '@/lib/socket';
import { GamePhaseManager } from './game-phase-manager';
import {
  PlayerCreationForm,
  type PlayerCreationData,
} from './player-creation-form';
import type { RoomState, Choice } from '../shared/types';
import { getAllGames, getApiUrl, AppConfig } from '../shared/config';
import { useRoomCode } from '@/components/host/room-code-provider';
import { ErrorBoundary, useErrorBoundary } from '@/components/error-boundary';
import { getTotalTimeForPhase } from '@/lib/game-timing';

export function HostClient({ code }: { code: string }) {
  const [state, setState] = useState<RoomState | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [scores, setScores] = useState<
    Array<{ playerId: string; score: number }>
  >([]);
  const [timer, setTimer] = useState<number>(0);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);
  const [showPlayerCreation, setShowPlayerCreation] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<string | null>(null);
  const [previousRound, setPreviousRound] = useState<number>(0);
  const [playerId, setPlayerId] = useState<string>('');
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  // Use Error Boundary hook for manual error throwing
  const { throwError } = useErrorBoundary();

  // Use the context to get and update room code
  const { roomCode, setRoomCode } = useRoomCode();

  // Available games data with themes
  const availableGames = getAllGames();

  // Reset component state when room code changes
  useEffect(() => {
    console.log('🔄 Room code changed to:', code);
    // Reset all component state when navigating to a different room
    setState(null);
    setChoices([]);
    setScores([]);
    setTimer(0);
    setSelectedGame(null);
    setShowAllGames(false);
    setShowPlayerCreation(true);
    setIsCreatingRoom(false);
    setPreviousPhase(null);
    setPreviousRound(0);
    setPlayerId('');
    
    // Close any existing socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reset room code context
    setRoomCode(code);
  }, [code, setRoomCode]);

  // Pre-select game based on URL or room state
  useEffect(() => {
    if (state?.gameType && !selectedGame) {
      setSelectedGame(state.gameType);
    }
  }, [state?.gameType, selectedGame]);

  const handlePlayerCreation = async (data: PlayerCreationData) => {
    setShowPlayerCreation(false);
    setIsCreatingRoom(true);

    try {
      console.log('🏠 Creating room via API...');
      console.log('🏠 Using room code from URL:', code);
      console.log('🏠 Current component state - isCreatingRoom:', isCreatingRoom);
      
      // First, create the room via API with the specific room code from URL
      const response = await fetch(
        getApiUrl('http') + AppConfig.API.ROOMS_ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameType: 'fibbing-it',
            roomCode: code, // Use the room code from the URL
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const roomData = await response.json();
      console.log('✅ Room creation response:', roomData);

      if (roomData.error) {
        throw new Error(roomData.error);
      }

      // Room created successfully - the code should be the same as the URL
      if (roomData.code !== code) {
        console.warn(
          '⚠️ Room code mismatch - expected:',
          code,
          'got:',
          roomData.code
        );
      }

      // Update the room code in context (this will update the layout)
      setRoomCode(roomData.code);

      // URL should already be correct since we're using the URL code
      console.log(
        '🔗 Room created with code:',
        roomData.code,
        'URL code:',
        code
      );

      // Now connect to socket and join the created room
      console.log('🔌 Connecting to room via WebSocket:', roomData.code);
      const s = connectToRoom(roomData.code);
      socketRef.current = s;

      // Wait for connection to be established before joining
      s.on('connect', () => {
        console.log('🔌 Host connected, joining room as player...');
        console.log('🔌 Host socket ID:', s.id);
        
        // Small delay to ensure connection is fully established
        setTimeout(() => {
          console.log('🎯 Emitting join event...');
          s.emit('join', {
            nickname: data.nickname,
            avatar: data.avatar,
          });
        }, 100);
      });

      // Listen for join confirmation
      s.on('joined', (data: { ok: boolean }) => {
        console.log('✅ Host successfully joined room:', data);
        // Set the host's player ID from the socket connection
        setPlayerId(s.id || '');
        console.log('🏠 Host player ID set to:', s.id);
      });

      // Listen for errors
      s.on('error', (error: unknown) => {
        console.error('❌ Socket error:', error);
        throwError(`WebSocket error: ${JSON.stringify(error)}`);
      });

      s.on('connect_error', (error: Error) => {
        console.error('❌ Connection error:', error);
        throwError(`Connection failed: ${error.message}`);
      });

      // Listen for answerSubmitted
      s.on('answerSubmitted', (data: { answerId: string; playerId: string }) => {
        console.log('✍️ Answer submitted:', data);
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
        votes: Array<{ voter: string; choiceId: string }> 
      }) => {
        console.log('🎭 Reveal phase data received:', data);
        // Store reveal data for the reveal phase component
        setState(prev => prev ? { ...prev, revealData: data } : null);
      });

      s.on(
        'scores',
        (data: { totals: Array<{ playerId: string; score: number }> }) => {
          console.log('🏆 Scores received:', data);
          setScores(data.totals);
        }
      );

      // Listen for gameOver
      s.on(
        'gameOver',
        (data: {
          winners: Array<{ id: string; name: string; score: number }>;
        }) => {
          console.log('🎉 Game over:', data);
        }
      );

      // Listen for timer updates
      s.on('timer', (data: { timeLeft: number }) => {
        console.log('⏰ Timer update:', data.timeLeft);
        setTimer(data.timeLeft);
      });

      // Listen for room state updates
      s.on('room', (roomState: RoomState) => {
        console.log('🏠 Room state update:', roomState);
        
        // Extract choices from room state if available
        if (roomState.choices && Array.isArray(roomState.choices)) {
          console.log('🎲 Choices extracted from room state:', roomState.choices);
          setChoices(roomState.choices);
        }
        
        // Handle phase changes - no need to manually reset states since they're computed
        if (previousPhase && previousPhase !== roomState.phase) {
          console.log(`🔄 Phase change: ${previousPhase} → ${roomState.phase}`);
        }

        // Handle new rounds - no need to manually reset states since they're computed
        if (previousRound !== roomState.round && roomState.phase === 'prompt') {
          console.log(`🔄 New round started: ${previousRound} → ${roomState.round}`);
        }

        setPreviousPhase(roomState.phase);
        setPreviousRound(roomState.round);
        setState(roomState);
        setTimer(roomState.timeLeft || 0);
      });
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      setShowPlayerCreation(true); // Show form again on error
      setIsCreatingRoom(false);
    }
  };

  const start = () => {
    const gameType = state?.gameType || selectedGame;
    if (!gameType) {
      console.warn('No game type selected, cannot start game');
      return;
    }
    if (!socketRef.current) {
      console.error('No socket connection, cannot start game');
      return;
    }
    console.log('🚀 Starting game:', gameType, 'with socket:', socketRef.current.id);
    socketRef.current.emit('startGame', { gameType });
  };

  const handleSubmitAnswer = (answer: string) => {
    if (!socketRef.current) return;
    console.log('✍️ Host submitting answer:', answer);
    // Emit the answer submission event - state will be updated via room updates
    socketRef.current.emit('submitAnswer', { answer });
  };

  const handleSubmitVote = (vote: string) => {
    if (!socketRef.current) return;
    console.log('🗳️ Host submitting vote:', vote);
    // Emit the vote submission event - state will be updated via room updates
    socketRef.current.emit('submitVote', { vote });
  };

  const handleDeleteRoom = async () => {
    if (!roomCode) return;
    
    // Add confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete room "${roomCode}"? This action cannot be undone and will disconnect all players.`
    );
    
    if (!confirmed) return;
    
    setIsDeletingRoom(true);
    try {
      console.log('🗑️ Deleting room:', roomCode);
      
      // First disconnect from socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Delete room via API
      const response = await fetch(
        getApiUrl('http') + AppConfig.API.ROOMS_ENDPOINT + `/${roomCode}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Room deleted successfully:', result);
        
        if (result.success) {
          // Show success message
          alert(`Room "${roomCode}" deleted successfully!`);
          // Reset component state
          setState(null);
          setChoices([]);
          setScores([]);
          setTimer(0);
          setSelectedGame(null);
          setShowAllGames(false);
          setShowPlayerCreation(true);
          setIsCreatingRoom(false);
          setPreviousPhase(null);
          setPreviousRound(0);
          setPlayerId('');
        } else {
          // Show error message from server
          alert(`Failed to delete room: ${result.message}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete room:', response.status, errorText);
        alert(`Failed to delete room: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting room:', error);
      alert(`Error deleting room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const handleGameSelect = (gameId: string) => {
    if (gameId === 'toggle') {
      setShowAllGames(!showAllGames);
    } else {
      setSelectedGame(gameId);
      setShowAllGames(false); // Close the expanded list

      // Update the room's game type via WebSocket if connected
      if (socketRef.current && state) {
        // TODO: Implement game type change via WebSocket
        console.log('🔄 Changing game type to:', gameId);
      }
    }
  };

  const toggleGameSelection = () => {
    setShowAllGames(!showAllGames);
  };

  // Get the selected game info for display
  const selectedGameInfo =
    availableGames.find(game => game.id === (state?.gameType || selectedGame)) || availableGames[0];

  // Compute submission and voting state from game state
  // Use the structure that the backend actually sends (old structure)
  const hasSubmittedAnswer: boolean = 
    (state?.current?.bluffs?.some(
      (bluff: { by: string }) => bluff?.by === playerId
    )) ||
    (state?.current?.correctAnswerPlayers?.includes(playerId)) ||
    false;

  const hasVoted: boolean = 
    (state?.current?.votes?.some(
      (vote: { voter: string }) => vote?.voter === playerId
    )) ||
    false;

  const selectedChoiceId: string | undefined = 
    state?.current?.votes?.find(
      (vote: { voter: string; vote: string }) => vote?.voter === playerId
    )?.vote;

  // Debug logging for computed values
  console.log('🏠 HostClient computed values:', {
    playerId,
    hasSubmittedAnswer,
    hasVoted,
    selectedChoiceId,
    bluffs: state?.current?.bluffs,
    correctAnswerPlayers: state?.current?.correctAnswerPlayers,
    votes: state?.current?.votes,
    phase: state?.phase,
    round: state?.round
  });

  // Show player creation form first
  if (showPlayerCreation) {
    return (
      <ErrorBoundary>
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <PlayerCreationForm
            onSubmit={handlePlayerCreation}
            onCancel={() => window.history.back()}
            isHost={true}
          />

          {isCreatingRoom && (
            <div className="text-center text-slate-300 mt-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full mr-2"></div>
              Creating room...
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        {state ? (
          <>
            {console.log(
              '🏠 HostClient rendering GamePhaseManager with state:',
              state
            )}
            
            {/* Debug Controls */}
            <div className="fixed top-4 right-4 z-50">
              <div className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
                <button
                  onClick={handleDeleteRoom}
                  className="flex items-center gap-2 font-semibold"
                  title={`Delete room ${roomCode} (Debug tool)`}
                  disabled={isDeletingRoom}
                >
                  {isDeletingRoom ? (
                    <>
                      <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      🗑️ Delete Room
                      <span className="text-xs opacity-75">({roomCode})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <GamePhaseManager
              gameType={state.gameType || selectedGame || 'fibbing-it'}
              phase={state.phase || 'lobby'}
              isHost={true}
              roomCode={roomCode}
              question={state.current?.prompt}
              correctAnswer={state.current?.answer}
              timeLeft={timer}
              totalTime={getTotalTimeForPhase(state.phase)}
              round={state.round || 1}
              maxRounds={state.maxRounds || 5}
              choices={choices}
              votes={state.current?.votes || []}
              players={state.players || []}
              scores={scores}
              onStartGame={start}
              selectedGame={selectedGameInfo}
              onGameSelect={gameId => {
                if (gameId === 'toggle') {
                  toggleGameSelection();
                } else {
                  handleGameSelect(gameId);
                }
              }}
              availableGames={availableGames}
              showAllGames={showAllGames}
              onSubmitAnswer={handleSubmitAnswer}
              onSubmitVote={handleSubmitVote}
              hasSubmittedAnswer={hasSubmittedAnswer}
              hasVoted={hasVoted}
              selectedChoiceId={selectedChoiceId}
            />
          </>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-400 border-t-transparent mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4">Connecting to Room</h2>
              <p className="text-slate-300 mb-4">Establishing connection...</p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 inline-block">
                <span className="text-lg font-mono text-white font-bold">{roomCode}</span>
              </div>
            </div>
          </div>
        )}
      </>
    </ErrorBoundary>
  );
}
