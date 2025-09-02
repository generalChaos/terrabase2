"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Users, Clock, Star } from "lucide-react";
import { getAllGames, getApiUrl, AppConfig, type GameInfo } from "@party/config";
import { Card, CardContent, CardTitle, CardDescription } from "@party/ui";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Confetti Background with Opacity Mask */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Small confetti layer - BASE LAYER */}
        <div 
          className="absolute inset-0 w-full h-full bg-[url('/confetti-pack/confetti-tile-1.svg')] bg-repeat opacity-50 confetti-mask-custom"
          style={{ 
            backgroundSize: '120px 120px',
            backgroundPosition: '0 0',
            zIndex: 0
          }}
        />
        {/* Large confetti layer - ON TOP OF SMALL */}
        <div 
          className="absolute inset-0 w-full h-full bg-[url('/confetti-pack/confetti-sprinkles.svg')] bg-repeat opacity-60 confetti-mask-custom"
          style={{ 
            backgroundPosition: '0 0',
            zIndex: 1
          }}
        />
      </div>

      {/* Hero Glow Effect - Above confetti, below game grid */}
      <div className="absolute inset-0 pointer-events-none z-5">
        <div 
          className="w-full h-full opacity-30"
          style={{
            backgroundImage: 'radial-gradient(80% 60% at 50% 20%, rgba(56,189,248,0.4) 0%, rgba(217,70,239,0.3) 50%, transparent 70%)',
            backgroundSize: '1200px 800px',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
          }}
        />
      </div>

      {/* Hero Banner */}
      <div className="relative z-20 w-full">
        <div className="text-center pt-20 pb-16 px-6">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg font-bangers">
            Party Game
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The ultimate collection of party games for friends and family
          </p>
        </div>
      </div>

      {/* Game Grid */}
      <div className="relative z-30 px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Card
              key={game.id}
              variant="elevated"
              size="xl"
              interactive
              animation="scale"
              className="group relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              {/* Content */}
              <CardContent className="relative z-10 h-full flex flex-col">
                {/* Game Icon */}
                <div className="text-6xl mb-4 text-center">{game.icon}</div>
                
                {/* Game Title */}
                <CardTitle className="text-3xl font-bold text-white mb-3 text-center">
                  {game.title}
                </CardTitle>
                
                {/* Description */}
                <CardDescription className="text-slate-300 text-center mb-6 flex-1 text-base">
                  {game.description}
                </CardDescription>
                
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
                <Button
                  variant="game"
                  size="lg"
                  onClick={() => createRoom(game.id)}
                  disabled={loading === game.id}
                  className={`w-full bg-gradient-to-r ${game.color}`}
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
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* How to Play Section */}
        <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-4xl font-bold text-white mb-8">How to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glass" size="lg" className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
              <CardContent className="text-center">
                <div className="text-4xl mb-4">1️⃣</div>
                <CardTitle className="text-xl font-semibold text-white mb-2">
                  Create a Room
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Choose your game and create a room. You&apos;ll get a unique room code to share.
                </CardDescription>
              </CardContent>
            </Card>
            <Card variant="glass" size="lg" className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
              <CardContent className="text-center">
                <div className="text-4xl mb-4">2️⃣</div>
                <CardTitle className="text-xl font-semibold text-white mb-2">
                  Share the Code
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Share the room code with friends. They can join using their phones.
                </CardDescription>
              </CardContent>
            </Card>
            <Card variant="glass" size="lg" className="animate-fade-in-up" style={{ animationDelay: '900ms' }}>
              <CardContent className="text-center">
                <div className="text-4xl mb-4">3️⃣</div>
                <CardTitle className="text-xl font-semibold text-white mb-2">
                  Start Playing
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Once everyone joins, start the game and have fun together!
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Development/Testing Section */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
            <h2 className="text-4xl font-bold text-white mb-8">Development & Testing</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <Card variant="glass" size="lg">
                <CardContent className="text-center">
                  <div className="text-4xl mb-4">🧪</div>
                  <CardTitle className="text-xl font-semibold text-white mb-2">
                    Fibbing It Test Environment
                  </CardTitle>
                  <CardDescription className="text-slate-300 mb-4">
                    Test all game phases and components without creating rooms or connecting to WebSockets.
                  </CardDescription>
                  <Button
                    variant="game"
                    size="lg"
                    onClick={() => router.push('/fibbing-it-test')}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    🎮 Test Fibbing It Game
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass" size="lg">
                <CardContent className="text-center">
                  <div className="text-4xl mb-4">❓</div>
                  <CardTitle className="text-xl font-semibold text-white mb-2">
                    Question Mark Avatar Demo
                  </CardTitle>
                  <CardDescription className="text-slate-300 mb-4">
                    Explore the new QuestionMarkAvatar component with different sizes and use cases.
                  </CardDescription>
                  <Button
                    variant="game"
                    size="lg"
                    onClick={() => router.push('/question-mark-avatar-demo')}
                    className="bg-gradient-to-r from-blue-500 to-teal-600"
                  >
                    👤 View Avatar Demo
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass" size="lg">
                <CardContent className="text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <CardTitle className="text-xl font-semibold text-white mb-2">
                    Layout System Test
                  </CardTitle>
                  <CardDescription className="text-slate-300 mb-4">
                    Test our new shared layout system for all game phases with mobile/desktop views.
                  </CardDescription>
                  <Button
                    variant="game"
                    size="lg"
                    onClick={() => router.push('/layout-test')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    🎨 Test Layout System
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass" size="lg">
                <CardContent className="text-center">
                  <div className="text-4xl mb-4">🏠</div>
                  <CardTitle className="text-xl font-semibold text-white mb-2">
                    Room Management Dashboard
                  </CardTitle>
                  <CardDescription className="text-slate-300 mb-4">
                    Debug tool for managing active game rooms, creating new rooms, and monitoring game state.
                  </CardDescription>
                  <Button
                    variant="game"
                    size="lg"
                    onClick={() => router.push('/room-dashboard')}
                    className="bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    🏠 Room Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
