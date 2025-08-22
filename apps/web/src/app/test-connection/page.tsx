'use client';
import { useEffect, useState } from 'react';
import { connectToRoom } from '@/lib/socket';

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>('disconnected');
  const [socketId, setSocketId] = useState<string>('');
  const [roomState, setRoomState] = useState<{
    code?: string;
    phase?: string;
    players?: Array<{ id: string; name: string; score: number }>;
  } | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toISOString()}: ${msg}`]);
  };

  useEffect(() => {
    const socket = connectToRoom('TEST123');

    addMessage('🔌 Attempting connection...');

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setSocketId(socket.id || '');
      addMessage(`✅ Connected! Socket ID: ${socket.id}`);
    });

    socket.on('disconnect', reason => {
      setConnectionStatus('disconnected');
      addMessage(`🔌 Disconnected: ${reason}`);
    });

    socket.on('connect_error', error => {
      setConnectionStatus('error');
      addMessage(`❌ Connection error: ${error.message}`);
    });

    socket.on('room', data => {
      setRoomState(data);
      addMessage(`🏠 Room state received: ${JSON.stringify(data)}`);
    });

    socket.on('joined', () => {
      addMessage('✅ Joined successfully!');
    });

    socket.on('error', error => {
      addMessage(`❌ Socket error: ${JSON.stringify(error)}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const testJoin = () => {
    const socket = connectToRoom('TEST123');
    addMessage('🧪 Testing join...');
    socket.emit('join', { nickname: 'TestPlayer', avatar: '🧪' });
  };

  return (
    <div className="min-h-screen bg-[--bg] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Connection Test</h1>

        <div className="grid gap-4 mb-8">
          <div className="bg-[--panel] p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
            <p
              className={`text-lg ${
                connectionStatus === 'connected'
                  ? 'text-green-500'
                  : connectionStatus === 'error'
                    ? 'text-red-500'
                    : 'text-yellow-500'
              }`}
            >
              {connectionStatus}
            </p>
            {socketId && (
              <p className="text-sm text-[--muted]">Socket ID: {socketId}</p>
            )}
          </div>

          <div className="bg-[--panel] p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Room State</h2>
            <pre className="text-sm bg-[--bg] p-2 rounded overflow-auto">
              {roomState
                ? JSON.stringify(roomState, null, 2)
                : 'No room state received'}
            </pre>
          </div>

          <div className="bg-[--panel] p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Actions</h2>
            <button
              onClick={testJoin}
              className="px-4 py-2 bg-[--accent] text-black rounded-lg mr-2"
            >
              Test Join
            </button>
          </div>

          <div className="bg-[--panel] p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Messages</h2>
            <div className="text-sm bg-[--bg] p-2 rounded max-h-64 overflow-auto">
              {messages.map((msg, i) => (
                <div key={i} className="mb-1">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
