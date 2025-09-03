'use client';
import { QuestionMarkAvatar } from '@/components/games/shared/ui';

export default function QuestionMarkAvatarDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Question Mark Avatar Demo
        </h1>
        
        <p className="text-center text-slate-300 mb-12 max-w-2xl mx-auto">
          This component provides a consistent silhouette design for unknown or placeholder avatars. 
          It&apos;s perfect for UI contexts where you need to show that an avatar is missing or unknown.
        </p>

        {/* Size Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Available Sizes</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
              <div key={size} className="text-center">
                <div className="mb-3">
                  <QuestionMarkAvatar size={size} />
                </div>
                <div className="text-sm text-slate-400 font-mono">{size}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Case Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Use Case Examples</h2>
          
          {/* Example 1: Unknown Player */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-teal-400">Unknown Player</h3>
            <div className="flex items-center gap-4">
              <QuestionMarkAvatar size="lg" />
              <div>
                <div className="text-white font-medium">Unknown Player</div>
                <div className="text-slate-400 text-sm">Player avatar not available</div>
              </div>
            </div>
          </div>

          {/* Example 2: Placeholder in List */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-teal-400">Placeholder in List</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <QuestionMarkAvatar size="md" />
                  <div className="text-white">Player {i}</div>
                </div>
              ))}
              <div className="flex items-center gap-3 opacity-60">
                <QuestionMarkAvatar size="md" />
                <div className="text-slate-400">Loading...</div>
              </div>
            </div>
          </div>

          {/* Example 3: Error State */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-400">Error State</h3>
            <div className="flex items-center gap-4">
              <QuestionMarkAvatar size="xl" className="border-red-500/60 bg-red-900/20" />
              <div>
                <div className="text-white font-medium">Failed to Load Avatar</div>
                <div className="text-red-400 text-sm">Avatar could not be displayed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Usage</h2>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300">
{`import { QuestionMarkAvatar } from '@/components/games/shared/ui';

// Basic usage
<QuestionMarkAvatar />

// With custom size
<QuestionMarkAvatar size="xl" />

// With custom styling
<QuestionMarkAvatar 
  size="2xl" 
  className="border-blue-500/60 bg-blue-900/20" 
/>`}
            </pre>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <button 
            onClick={() => window.history.back()}
            className="inline-block bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
