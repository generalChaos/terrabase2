import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Party Game API - Coming Soon!',
    status: 'placeholder',
    features: [
      'Multiplayer party games',
      'Real-time WebSocket connections',
      'Fibbing It game engine',
      'Bluff Trivia game engine'
    ],
    endpoints: {
      health: '/api/party-game/health',
      rooms: '/api/party-game/rooms',
      games: '/api/party-game/games'
    }
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Create room endpoint - Coming Soon!',
    status: 'placeholder',
    note: 'This will create new game rooms'
  });
}
