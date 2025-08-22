'use client';
import { useEffect, useRef, useState } from 'react';
import { connectToRoom } from '@/lib/socket';
import { GamePhaseManager } from './game-phase-manager';
import {
  PlayerCreationForm,
  type PlayerCreationData,
} from './player-creation-form';
import type { RoomState, Choice } from '@party/types';
import { DUR } from '@party/types';
import { getAllGames, getApiUrl, AppConfig } from '@party/config';
import { useRoomCode } from '@/components/host/room-code-provider';

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
  const socketRef = useRef<ReturnType<typeof connectToRoom> | null>(null);

  // Use the context to get and update room code
  const { roomCode, setRoomCode } = useRoomCode();

  // Available games data with themes
  const availableGames = getAllGames();

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

      // Listen for connection errors
      s.on('connect_error', (error) => {
        console.error('❌ Host connection error:', error);
        setShowPlayerCreation(true);
        setIsCreatingRoom(false);
      });

      // Listen for join confirmation
      s.on('joined', (data: { ok: boolean }) => {
        console.log('✅ Host successfully joined room:', data);
      });

      // Listen for join errors
      s.on('error', (error: Error) => {
        console.error('❌ Host join error:', error);
        setShowPlayerCreation(true);
        setIsCreatingRoom(false);
      });

      // Listen for room state updates
      s.on('room', (st: RoomState) => {
        console.log('🏠 Room state updated:', st);
        console.log('🏠 Players:', st.players);
        console.log('🏠 Host ID:', st.hostId);
        console.log('🏠 Current socket ID:', s.id);
        console.log('🏠 Phase changed from:', state?.phase, 'to:', st.phase);
        
        // Check if host is in the players list
        const hostPlayer = st.players.find(p => p.id === s.id);
        if (hostPlayer) {
          console.log('✅ Host found in players list:', hostPlayer);
        } else {
          console.warn('⚠️ Host not found in players list. Players:', st.players.map(p => ({ id: p.id, name: p.name })));
        }
        
        setState(st);
        setTimer(st.timeLeft || 0);
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

      s.on(
        'scores',
        (data: { totals: Array<{ playerId: string; score: number }> }) => {
          console.log('�� Scores received:', data);
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
      console.error('❌ Failed to create room:', error);
      setShowPlayerCreation(true); // Show form again on error
      setIsCreatingRoom(false);
    }
  };

  const start = () => {
    if (!selectedGame) {
      return;
    }
    socketRef.current?.emit('startGame', { gameType: selectedGame });
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
    availableGames.find(game => game.id === selectedGame) || availableGames[0];

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

        {isCreatingRoom && (
          <div className="text-center text-slate-300 mt-4">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full mr-2"></div>
            Creating room...
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {state ? (
        <>
          {console.log(
            '🏠 HostClient rendering GamePhaseManager with state:',
            state
          )}
          <GamePhaseManager
            gameType={state.gameType || selectedGame || 'fibbing-it'}
            phase={state.phase || 'lobby'}
            isHost={true}
            roomCode={roomCode}
            question={state.current?.prompt}
            correctAnswer={state.current?.answer}
            timeLeft={timer}
            totalTime={(() => {
              switch (state.phase) {
                case 'prompt':
                  return DUR.PROMPT;
                case 'choose':
                  return DUR.CHOOSE;
                case 'scoring':
                  return DUR.SCORING;
                default:
                  return 30;
              }
            })()}
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
  );
}
