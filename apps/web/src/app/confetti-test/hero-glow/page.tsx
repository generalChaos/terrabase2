'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroGlowTestPage() {
  const [glowIntensity, setGlowIntensity] = useState(0.15);
  const [glowColor, setGlowColor] = useState('#38bdf8');
  const [glowSize, setGlowSize] = useState(80);
  const [glowPosition, setGlowPosition] = useState(50);
  const [showConfetti, setShowConfetti] = useState(true);
  const [confettiPattern, setConfettiPattern] = useState('confetti-sprinkles.svg');
  const [backgroundColor, setBackgroundColor] = useState('#0b0f1a');
  


  const confettiPatterns = [
    'confetti-sprinkles.svg',
    'confetti-balloons.svg',
    'confetti-bubbles-squiggles.svg',
    'confetti-music-lightning.svg',
    'confetti-party-hats.svg',
    'confetti-ribbons-stars.svg',
    'confetti-sparkles.svg',
    'confetti-tile-1.svg'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">✨ Hero Glow Test</h1>
            <p className="text-gray-300 mt-1">Test the hero glow effect and its variations</p>
          </div>
          <Link 
            href="/confetti-test"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Main
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold">🎛️ Glow Controls</h2>
            
            {/* Glow Intensity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Glow Intensity: {Math.round(glowIntensity * 100)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Glow Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Glow Color</label>
              <input
                type="color"
                value={glowColor}
                onChange={(e) => setGlowColor(e.target.value)}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>

            {/* Glow Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Glow Size: {glowSize}%
              </label>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={glowSize}
                onChange={(e) => setGlowSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Glow Position */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Glow Position: {glowPosition}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={glowPosition}
                onChange={(e) => setGlowPosition(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium mb-2">Background Color</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>

            {/* Confetti Controls */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="showConfetti"
                  checked={showConfetti}
                  onChange={(e) => setShowConfetti(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="showConfetti" className="text-sm font-medium">
                  Show Confetti Pattern
                </label>
              </div>

              {showConfetti && (
                <div>
                  <label className="block text-sm font-medium mb-2">Confetti Pattern</label>
                  <select
                    value={confettiPattern}
                    onChange={(e) => setConfettiPattern(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    {confettiPatterns.map((pattern) => (
                      <option key={pattern} value={pattern}>
                        {pattern.replace('.svg', '').replace(/-/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Preset Buttons */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium mb-3">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGlowIntensity(0.15);
                    setGlowColor('#38bdf8');
                    setGlowSize(80);
                    setGlowPosition(50);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Default Blue
                </button>
                <button
                  onClick={() => {
                    setGlowIntensity(0.25);
                    setGlowColor('#f472b6');
                    setGlowSize(100);
                    setGlowPosition(30);
                  }}
                  className="bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Pink Glow
                </button>
                <button
                  onClick={() => {
                    setGlowIntensity(0.3);
                    setGlowColor('#10b981');
                    setGlowSize(120);
                    setGlowPosition(70);
                  }}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Green Aura
                </button>
                <button
                  onClick={() => {
                    setGlowIntensity(0.4);
                    setGlowColor('#f59e0b');
                    setGlowSize(150);
                    setGlowPosition(20);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Golden Halo
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">👀 Live Preview</h2>
            
            {/* Hero Glow Preview */}
            <div className="relative overflow-hidden rounded-lg border border-gray-600 bg-gray-900 mb-6" style={{ minHeight: '400px' }}>
              {/* Confetti Background Layer - Behind everything */}
              {showConfetti && (
                <div 
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url('/confetti-pack/${confettiPattern}')`,
                    backgroundSize: '280px 280px',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: '0 0'
                  }}
                />
              )}
              
              {/* Hero Glow Effect - Middle layer */}
              <div 
                className="absolute inset-0 z-10"
                style={{
                  backgroundImage: `
                    radial-gradient(${glowSize}% 60% at 50% ${glowPosition}%, 
                      ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}, 
                      transparent 50%)
                  `,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Content Overlay - Top layer */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="text-center pointer-events-auto">
                  <div className="room-code-glow bg-gray-800/80 backdrop-blur-sm px-8 py-4 rounded-xl text-3xl font-mono font-bold mb-4">
                    HERO GLOW
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Intensity: {Math.round(glowIntensity * 100)}%</div>
                    <div>Size: {glowSize}%</div>
                    <div>Position: {glowPosition}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated CSS */}
            <div>
              <h3 className="text-lg font-medium mb-2">Generated CSS</h3>
              <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto text-green-400">
                <code>{`
.hero-glow-preview {
  background-color: ${backgroundColor};
  background-image: radial-gradient(
    ${glowSize}% 60% at 50% ${glowPosition}%, 
    ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}, 
    transparent 50%
  )${showConfetti ? `,
    url('/confetti-pack/${confettiPattern}')` : ''};
  background-repeat: no-repeat${showConfetti ? ', repeat' : ''};
  background-size: ${glowSize * 15}px ${glowSize * 8.75}px${showConfetti ? `, 280px 280px` : ''};
  background-position: center ${glowPosition}%${showConfetti ? ', 0 0' : ''};
}
                `}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Hero Glow Asset Info */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">✨ Hero Glow Asset</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-3">Asset Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">File:</span> hero-glow.svg</div>
                <div><span className="text-gray-400">Size:</span> 1.0KB</div>
                <div><span className="text-gray-400">Type:</span> SVG Vector</div>
                <div><span className="text-gray-400">Usage:</span> Background gradient overlay</div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">How it works:</h4>
                <p className="text-sm text-gray-300">
                  The hero glow creates a radial gradient that adds depth and visual interest 
                  to the background. It&apos;s positioned at the top of the container and creates 
                  a subtle lighting effect that enhances the overall design.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Asset Preview</h3>
              <div className="bg-gray-700 rounded-lg p-6 flex items-center justify-center">
                <Image 
                  src="/confetti-pack/hero-glow.svg"
                  alt="Hero Glow"
                  width={128}
                  height={128}
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                This SVG is used as a reference for creating the radial gradient effect
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS is now handled by confetti-animations.css and useConfettiStyles hook */}
    </div>
  );
}
