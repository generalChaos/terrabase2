'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useConfettiStyles } from '../hooks/useConfettiStyles';
import '../styles/confetti-animations.css';

interface ConfettiOption {
  name: string;
  file: string;
  description: string;
  colors: string[];
}

const confettiOptions: ConfettiOption[] = [
  { 
    name: 'Sprinkles', 
    file: 'confetti-sprinkles.svg', 
    description: 'Colorful confetti sprinkles in various shapes and colors',
    colors: ['#ffd166', '#ffb3ba', '#6ee7ff', '#ff7ab6']
  },
  { 
    name: 'Balloons', 
    file: 'confetti-balloons.svg', 
    description: 'Floating balloons with strings in blue, pink, green, and yellow',
    colors: ['#60A5FA', '#F472B6', '#34D399', '#F59E0B']
  },
  { 
    name: 'Bubbles & Squiggles', 
    file: 'confetti-bubbles-squiggles.svg', 
    description: 'Playful bubbles and squiggly lines',
    colors: ['#A78BFA', '#FBBF24', '#34D399', '#F472B6']
  },
  { 
    name: 'Music & Lightning', 
    file: 'confetti-music-lightning.svg', 
    description: 'Musical notes and lightning bolts',
    colors: ['#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
  },
  { 
    name: 'Party Hats', 
    file: 'confetti-party-hats.svg', 
    description: 'Celebratory party hats in festive colors',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6']
  },
  { 
    name: 'Ribbons & Stars', 
    file: 'confetti-ribbons-stars.svg', 
    description: 'Elegant ribbons and stars',
    colors: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981']
  },
  { 
    name: 'Sparkles', 
    file: 'confetti-sparkles.svg', 
    description: 'Shimmering sparkles and glitter effects',
    colors: ['#FCD34D', '#F472B6', '#60A5FA', '#34D399']
  },
  { 
    name: 'Tile Pattern', 
    file: 'confetti-tile-1.svg', 
    description: 'Geometric tile pattern with structured design',
    colors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB']
  },
];

export default function IndividualTestPage() {
  const [selectedOption, setSelectedOption] = useState(0);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(40);
  const [tileSize, setTileSize] = useState(280);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [showHeroGlow, setShowHeroGlow] = useState(true);
  const [showGradients, setShowGradients] = useState(true);
  const [gradientMask, setGradientMask] = useState<'none' | 'subtle' | 'normal' | 'strong'>('normal');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#0b0f1a');
  const [activeTab, setActiveTab] = useState<'preview' | 'controls' | 'performance'>('preview');

  const currentOption = confettiOptions[selectedOption];
  const previewRef = useRef<HTMLDivElement>(null);
  const { setConfettiStyles, getAnimationClass, getBackgroundClasses } = useConfettiStyles();
  
  // Store original values for reset functionality
  const originalValues = useRef({
    selectedOption: 0,
    animationEnabled: true,
    animationSpeed: 40,
    tileSize: 280,
    backgroundOpacity: 1,
    showHeroGlow: true,
    showGradients: true,
    gradientMask: 'normal' as const,
    customBackgroundColor: '#0b0f1a'
  });

  // Apply styles to preview element
  useEffect(() => {
    if (previewRef.current) {
      setConfettiStyles(previewRef.current, {
        tileSize,
        animationDuration: animationSpeed,
        backgroundColor: customBackgroundColor,
        selectedBackground: currentOption.file,
        gradientMask
      });
    }
  }, [selectedOption, animationSpeed, tileSize, customBackgroundColor, gradientMask, setConfettiStyles, currentOption.file]);

  // Reset function to restore original values
  const resetToDefaults = () => {
    setSelectedOption(originalValues.current.selectedOption);
    setAnimationEnabled(originalValues.current.animationEnabled);
    setAnimationSpeed(originalValues.current.animationSpeed);
    setTileSize(originalValues.current.tileSize);
    setBackgroundOpacity(originalValues.current.backgroundOpacity);
    setShowHeroGlow(originalValues.current.showHeroGlow);
    setShowGradients(originalValues.current.showGradients);
    setGradientMask(originalValues.current.gradientMask);
    setCustomBackgroundColor(originalValues.current.customBackgroundColor);
  };

  // Apply function to update styles
  const applyChanges = () => {
    if (previewRef.current) {
      setConfettiStyles(previewRef.current, {
        tileSize,
        animationDuration: animationSpeed,
        backgroundColor: customBackgroundColor,
        selectedBackground: currentOption.file,
        gradientMask
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">🎨 Individual Confetti Tests</h1>
              <p className="text-gray-300 mt-1">Test each confetti pattern individually</p>
            </div>
            <Link 
              href="/confetti-test"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Main
            </Link>
          </div>
          
          {/* Navigation Bar */}
          <div className="flex gap-2">
            <Link 
              href="/confetti-test"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🏠 Main
            </Link>
            <Link 
              href="/confetti-test/individual"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              🎨 Individual
            </Link>
            <Link 
              href="/confetti-test/animation"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🎬 Animation
            </Link>
            <Link 
              href="/confetti-test/parallax"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              🌊 Parallax
            </Link>
            <Link 
              href="/confetti-test/hero-glow"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              ✨ Hero Glow
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabbed Interface */}
        <div className="bg-gray-800 rounded-lg">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              👀 Preview
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'controls'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🎛️ Controls
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📊 Performance
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Preview Tab - Default Active */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">👀 Preview</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={resetToDefaults}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <span>🔄</span>
                      Reset
                    </button>
                    <button
                      onClick={applyChanges}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <span>✅</span>
                      Apply
                    </button>
                  </div>
                </div>
                
                {/* Pattern Info */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{currentOption.name}</h3>
                      <p className="text-gray-300 mb-3">{currentOption.description}</p>
                      
                      {/* Color Palette */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">Color Palette</h4>
                        <div className="flex space-x-2">
                          {currentOption.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border-2 border-gray-600"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="text-gray-400">File</div>
                      <div className="font-mono">{currentOption.file}</div>
                      <div className="text-gray-400 mt-1">Size</div>
                      <div className="font-mono">280×280px</div>
                    </div>
                  </div>
                </div>
                
                {/* Live Preview */}
                <div className="relative overflow-hidden rounded-lg border border-gray-600 bg-gray-900" style={{ minHeight: '500px' }}>
                  {/* Animated Background Layer */}
                  <div 
                    ref={previewRef}
                    className={`${getBackgroundClasses(showGradients, showHeroGlow, gradientMask)} ${animationEnabled ? getAnimationClass('fall-down') : ''}`}
                    style={{ 
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      opacity: backgroundOpacity
                    }}
                  />
                  
                  {/* Static Information Overlay - Completely Separate Layer */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="text-center pointer-events-auto">
                      <div className="room-code-glow bg-gray-800/80 backdrop-blur-sm px-8 py-4 rounded-xl text-3xl font-mono font-bold mb-4">
                        {currentOption.name.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-300 space-y-1 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <div>Pattern: {currentOption.file}</div>
                        <div>Animation: {animationEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div>Speed: {animationSpeed}s</div>
                        <div>Tile Size: {tileSize}px</div>
                        <div>Opacity: {Math.round(backgroundOpacity * 100)}%</div>
                        <div>Mask: {gradientMask.charAt(0).toUpperCase() + gradientMask.slice(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">🎛️ Controls</h2>
                
                {/* Pattern Selector */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">🎯 Pattern Selector</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {confettiOptions.map((option, index) => (
                      <div
                        key={option.file}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedOption === index 
                            ? 'bg-blue-600 ring-2 ring-blue-400' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        onClick={() => setSelectedOption(index)}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-500 rounded mx-auto mb-2 flex items-center justify-center">
                            <Image 
                              src={`/confetti-pack/${option.file}`}
                              alt={option.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </div>
                          <h4 className="font-medium text-sm">{option.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animation Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Animation</h3>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="animationEnabled"
                        checked={animationEnabled}
                        onChange={(e) => setAnimationEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="animationEnabled" className="text-sm">
                        Enable Animation
                      </label>
                    </div>

                    {animationEnabled && (
                      <div>
                        <label className="block text-sm mb-2">
                          Speed: {animationSpeed}s
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={animationSpeed}
                          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Visual Controls */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Visual</h3>
                    
                    <div>
                      <label className="block text-sm mb-2">
                        Tile Size: {tileSize}px
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="500"
                        step="20"
                        value={tileSize}
                        onChange={(e) => setTileSize(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        Background Opacity: {Math.round(backgroundOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Effect Controls */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Effects</h3>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showHeroGlow"
                        checked={showHeroGlow}
                        onChange={(e) => setShowHeroGlow(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="showHeroGlow" className="text-sm">
                        Hero Glow
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showGradients"
                        checked={showGradients}
                        onChange={(e) => setShowGradients(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="showGradients" className="text-sm">
                        Gradients
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Gradient Mask</label>
                      <select
                        value={gradientMask}
                        onChange={(e) => setGradientMask(e.target.value as 'none' | 'subtle' | 'normal' | 'strong')}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      >
                        <option value="none">None</option>
                        <option value="subtle">Subtle</option>
                        <option value="normal">Normal</option>
                        <option value="strong">Strong</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {gradientMask === 'none' && 'No fade effect'}
                        {gradientMask === 'subtle' && 'Gentle fade from bottom'}
                        {gradientMask === 'normal' && 'Standard fade from bottom'}
                        {gradientMask === 'strong' && 'Strong fade from bottom'}
                      </p>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Background</h3>
                    
                    <div>
                      <label className="block text-sm mb-2">Background Color</label>
                      <input
                        type="color"
                        value={customBackgroundColor}
                        onChange={(e) => setCustomBackgroundColor(e.target.value)}
                        className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset/Apply Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={resetToDefaults}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <span>🔄</span>
                    Reset to Defaults
                  </button>
                  <button
                    onClick={applyChanges}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <span>✅</span>
                    Apply Changes
                  </button>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">📊 Performance</h2>
                <p className="text-gray-300">Performance monitoring tools will be added here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS is now handled by confetti-animations.css and useConfettiStyles hook */}
    </div>
  );
}
