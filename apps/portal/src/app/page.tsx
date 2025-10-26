import { ExternalLink, Github, Code, Zap } from "lucide-react";
import Image from "next/image";
import config from "@/lib/config";
import SupabaseTest from "@/components/supabase-test";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header with background image and space gradient */}
      <div className="header-bg relative">
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <Image
                src="/terrabase2_logo_transparent.png"
                alt="Terrabase2 Logo"
                width={200}
                height={80}
                className="mx-auto"
                priority
              />
            </div>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto backdrop-blur-sm bg-white/5 px-4 py-2 rounded-lg">
              A collection of innovative applications and tools showcasing modern web development
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Party Game */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Party Game</h2>
            </div>
            <p className="text-slate-300 mb-6">
              Real-time multiplayer party game with WebSocket support, featuring multiple game modes 
              and interactive gameplay experiences.
            </p>
            <div className="flex gap-3">
              <a 
                href={config.urls.partyGame} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {config.environment.isDevelopment ? 'Dev Server' : 'Live Demo'}
              </a>
              <a 
                href={config.github.partyGame} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Github className="w-4 h-4" />
                Code
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded">Next.js</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-sm rounded">NestJS</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-sm rounded">WebSocket</span>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-sm rounded">TypeScript</span>
            </div>
          </div>

          {/* Magic Marker */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Magic Marker</h2>
            </div>
            <p className="text-slate-300 mb-6">
              AI-powered image analysis and generation tool with advanced computer vision 
              capabilities and creative AI features.
            </p>
            <div className="flex gap-3">
              <a 
                href={config.urls.magicMarker} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {config.environment.isDevelopment ? 'Dev Server' : 'Live Demo'}
              </a>
              <a 
                href={config.github.magicMarker} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Github className="w-4 h-4" />
                Code
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded">React</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-sm rounded">Express</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-sm rounded">AI/ML</span>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-sm rounded">Vite</span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="max-w-2xl mx-auto mt-16 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="mb-4">
            <h3 className="text-2xl font-semibold text-white mb-1">Ricardo Velasco</h3>
            <p className="text-lg text-slate-300">Engineering Manager / Fullstack Software Engineer</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            I tinker for fun, learning CAD, 3D-printing small wins like a coupler that fixed a leak. When I'm not painting with watercolors or playing board games, I'm collecting national park memories (Bear Gulch at Pinnacles!) and hosting our annual multi-family Channel Islands trip as the campfire's "Fire Marshal."
          </p>
          <div className="mt-6 flex gap-3">
            <a 
              href="/resume/Ricardo_Velasco_Resume_Senior_FullStack_IC_102025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Resume
            </a>
            <a 
              href="mailto:velasco.rico@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Contact
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-slate-400">
          <p>Built with modern web technologies and deployed on the cloud</p>
        </div>
      </div>
    </div>
  );
}
