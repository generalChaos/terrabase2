'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Room {
  code: string;
  gameType: string;
  phase: string;
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
  }>;
  createdAt: Date;
  lastActivity: Date;
}

export default function RoomDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomCode, setNewRoomCode] = useState('');

  useEffect(() => {
    const newSocket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/rooms', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('🔌 Connected to room dashboard, socket ID:', newSocket.id);
      setLoading(false);
      // Request rooms immediately after connection
      console.log('🔌 Requesting rooms after connection...');
      newSocket.emit('getRooms');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from room dashboard');
    });

    newSocket.on('error', (err: string) => {
      console.error('❌ Socket error:', err);
      setError(err);
      setLoading(false);
    });

    newSocket.on('connect_error', (err: any) => {
      console.error('❌ Connection error:', err);
      setError(`Connection error: ${err.message}`);
      setLoading(false);
    });

    // Request room list
    console.log('🔌 Emitting getRooms...');
    newSocket.emit('getRooms');

    // Listen for room updates
    newSocket.on('roomList', (roomList: Room[]) => {
      console.log('📋 Received room list:', roomList);
      setRooms(roomList);
    });

    // Listen for room created events
    newSocket.on('roomCreated', (room: Room) => {
      console.log('🏠 Room created:', room);
      setRooms(prev => [...prev, room]);
    });

    newSocket.on('roomDeleted', (roomCode: string) => {
      console.log(`🗑️ Room ${roomCode} deleted`);
      setRooms(prev => prev.filter(room => room.code !== roomCode));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleDeleteRoom = (roomCode: string) => {
    if (socket) {
      socket.emit('deleteRoom', { roomCode });
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    window.open(`/join/${roomCode}`, '_blank');
  };

  const handleHostRoom = (roomCode: string) => {
    window.open(`/host/${roomCode}`, '_blank');
  };

  const handleCreateRoom = () => {
    if (newRoomCode.trim()) {
      if (socket) {
        socket.emit('createRoom', { code: newRoomCode.trim(), gameType: 'fibbing-it' });
        setNewRoomCode('');
      }
    }
  };

  const handleRefreshRooms = () => {
    if (socket) {
      socket.emit('getRooms');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-300">Loading room dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Room Management Dashboard</h1>
          <p className="text-slate-400">Debug tool for managing active game rooms</p>
        </div>

        {/* Create Room Section */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter room code (e.g., TEST123)"
                value={newRoomCode}
                onChange={(e) => setNewRoomCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <Button onClick={handleCreateRoom} disabled={!newRoomCode.trim()}>
                Create Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <Button onClick={handleRefreshRooms} variant="outline">
            🔄 Refresh Rooms
          </Button>
          <Badge variant="secondary" className="text-sm">
            {rooms.length} Active Rooms
          </Badge>
        </div>

        {/* Room List */}
        <div className="grid gap-4">
          {rooms.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <p className="text-slate-400">No active rooms found</p>
                <p className="text-slate-500 text-sm mt-2">Create a room above to get started</p>
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => (
              <Card key={room.code} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{room.code}</h3>
                      <Badge variant="outline" className="text-xs">
                        {room.gameType}
                      </Badge>
                      <Badge 
                        variant={room.phase === 'lobby' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {room.phase}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      {room.players.length} players
                    </div>
                  </div>

                  {/* Player List */}
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2">Players:</div>
                    <div className="flex flex-wrap gap-2">
                      {room.players.map((player) => (
                        <Badge 
                          key={player.id} 
                          variant={player.isHost ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {player.name} {player.isHost ? '(Host)' : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-slate-400">
                    <div>
                      <span className="font-medium">Created:</span> {room.createdAt.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Activity:</span> {room.lastActivity.toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleHostRoom(room.code)}
                      variant="outline"
                      size="sm"
                    >
                      🎮 Host
                    </Button>
                    <Button 
                      onClick={() => handleJoinRoom(room.code)}
                      variant="outline"
                      size="sm"
                    >
                      👥 Join
                    </Button>
                                         <Button 
                       onClick={() => handleDeleteRoom(room.code)}
                       variant="danger"
                       size="sm"
                     >
                       🗑️ Delete
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
