import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    games: [
      { 
        id: 'fibbing-it', 
        name: 'Fibbing It', 
        status: 'coming-soon',
        description: 'A creative storytelling game where players make up answers'
      },
      { 
        id: 'bluff-trivia', 
        name: 'Bluff Trivia', 
        status: 'coming-soon',
        description: 'A trivia game where you can bluff your way to victory'
      }
    ],
    total: 2
  });
}
