"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Users, Clock, Star } from "lucide-react";
import { getAllGames, getApiUrl, AppConfig, type GameInfo } from "@party/config";

const games: GameInfo[] = getAllGames();

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function createRoom(gameId: string) {
    setLoading(gameId);
    try {
      const base = getApiUrl('http');
      console.log('Creating room for game:', gameId, 'at URL:', base + AppConfig.API.ROOMS_ENDPOINT);
      
      const res = await fetch(base + AppConfig.API.ROOMS_ENDPOINT, { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameType: gameId })
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.code) {
        console.log('Room created successfully, redirecting to:', `/host/${data.code}`);
        router.push(`/host/${data.code}`);
      } else {
        console.error('No room code in response:', data);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      // You could add a toast notification here
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="text-center pt-16 pb-12">
        <h1 className="text-7xl font-bold text-white tracking-wider mb-4">
          PARTY GAMES
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Choose your game and start the party! All games are designed to be played on phones 
          with friends in the same room.
        </p>
      </div>

      {/* Game Selection Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <div
              key={game.id}
              className={`relative group overflow-hidden rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative p-8 h-full flex flex-col">
                {/* Game Icon */}
                <div className="text-6xl mb-4 text-center">{game.icon}</div>
                
                {/* Game Title */}
                <h2 className="text-3xl font-bold text-white mb-3 text-center">
                  {game.title}
                </h2>
                
                {/* Description */}
                <p className="text-slate-300 text-center mb-6 flex-1">
                  {game.description}
                </p>
                
                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-sm text-slate-300">{game.players}</div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-sm text-slate-300">{game.duration}</div>
                  </div>
                  <div className="text-center">
                    <Star className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <div className="text-sm text-slate-300">{game.difficulty}</div>
                  </div>
                </div>
                
                {/* Play Button */}
                <button
                  onClick={() => createRoom(game.id)}
                  disabled={loading === game.id}
                  className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r ${game.color} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg`}
                >
                  {loading === game.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Room...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Play className="w-5 h-5 mr-2" />
                      Play Now
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* How to Play Section */}
        <div className="mt-20 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">How to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className="text-xl font-semibold text-white mb-2">Create a Room</h3>
              <p className="text-slate-300">Choose your game and create a room. You&apos;ll get a unique room code to share.</p>
            </div>
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className="text-xl font-semibold text-white mb-2">Share the Code</h3>
              <p className="text-slate-300">Share the room code with friends. They can join using their phones.</p>
            </div>
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className="text-xl font-semibold text-white mb-2">Start Playing</h3>
              <p className="text-slate-300">Once everyone joins, start the game and have fun together!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
