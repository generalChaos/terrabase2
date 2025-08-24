'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useConfettiStyles } from './hooks/useConfettiStyles';
// Performance components removed during simplification
import './styles/confetti-animations.css';

interface ConfettiOption {
  name: string;
  file: string;
  description: string;
  category: 'tiles' | 'effects';
}

const confettiOptions: ConfettiOption[] = [
  { name: 'Sprinkles', file: 'confetti-sprinkles.svg', description: 'Colorful confetti sprinkles', category: 'tiles' },
  { name: 'Balloons', file: 'confetti-balloons.svg', description: 'Floating balloons with strings', category: 'tiles' },
  { name: 'Bubbles & Squiggles', file: 'confetti-bubbles-squiggles.svg', description: 'Playful bubbles and squiggly lines', category: 'tiles' },
  { name: 'Music & Lightning', file: 'confetti-music-lightning.svg', description: 'Musical notes and lightning bolts', category: 'tiles' },
  { name: 'Party Hats', file: 'confetti-party-hats.svg', description: 'Celebratory party hats', category: 'tiles' },
  { name: 'Ribbons & Stars', file: 'confetti-ribbons-stars.svg', description: 'Elegant ribbons and stars', category: 'tiles' },
  { name: 'Sparkles', file: 'confetti-sparkles.svg', description: 'Shimmering sparkles', category: 'tiles' },
  { name: 'Tile Pattern', file: 'confetti-tile-1.svg', description: 'Geometric tile pattern', category: 'tiles' },
];

export default function ConfettiTestPage() {
  const [selectedBackground, setSelectedBackground] = useState('confetti-sprinkles.svg');
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(40);
  const [tileSize, setTileSize] = useState(280);
  const [customColor, setCustomColor] = useState('#0b0f1a');
  const [showHeroGlow, setShowHeroGlow] = useState(true);
  const [showGradients, setShowGradients] = useState(true);
  const [gradientMask, setGradientMask] = useState<'none' | 'subtle' | 'normal' | 'strong'>('normal');
  const [multiLayerMode, setMultiLayerMode] = useState(false);
  const [layerCount, setLayerCount] = useState(3);
  const [activeTab, setActiveTab] = useState<'preview' | 'controls' | 'performance'>('preview');
  
  const previewRef = useRef<HTMLDivElement>(null);
  const { setConfettiStyles, getAnimationClass, getBackgroundClasses } = useConfettiStyles();
  
  // Store original values for reset functionality
  const originalValues = useRef({
    selectedBackground: 'confetti-sprinkles.svg',
    animationEnabled: true,
    animationSpeed: 40,
    tileSize: 280,
    customColor: '#0b0f1a',
    showHeroGlow: true,
    showGradients: true,
    gradientMask: 'normal' as const,
    multiLayerMode: false,
    layerCount: 3
  });

  const generateCSS = useCallback(() => {
    const baseUrl = '/confetti-pack/';
    let css = `.party-bg {\n`;
    css += `  background-color: ${customColor};\n`;
    
    if (multiLayerMode) {
      // Multi-layer mode with parallax effect
      css += `  position: relative;\n`;
      css += `  overflow: hidden;\n`;
      css += `}\n\n`;
      
      // Generate multiple layers
      for (let i = 0; i < layerCount; i++) {
        const layerSize = tileSize * (1 + i * 0.3);
        const layerOpacity = 1 - (i * 0.2);
        const layerSpeed = animationSpeed * (1 + i * 0.5);
        
        css += `.party-bg::before:nth-child(${i + 1}) {\n`;
        css += `  content: "";\n`;
        css += `  position: absolute;\n`;
        css += `  top: 0;\n`;
        css += `  left: 0;\n`;
        css += `  width: 100%;\n`;
        css += `  height: 100%;\n`;
        css += `  background-image: url('${baseUrl}${selectedBackground}');\n`;
        css += `  background-repeat: repeat;\n`;
        css += `  background-size: ${layerSize}px ${layerSize}px;\n`;
        css += `  opacity: ${layerOpacity};\n`;
        css += `  z-index: ${-i - 1};\n`;
        
        if (animationEnabled) {
          css += `  animation: layer-drift-${i + 1} ${layerSpeed}s linear infinite;\n`;
        }
        
        css += `}\n\n`;
        
        if (animationEnabled) {
          css += `@keyframes layer-drift-${i + 1} {\n`;
          css += `  from { background-position: 0 0; }\n`;
          css += `  to   { background-position: -${layerSize}px -${layerSize}px; }\n`;
          css += `}\n\n`;
        }
      }
    } else {
      // Single layer mode
      if (showGradients) {
        css += `  background-image:\n`;
        if (showHeroGlow) {
          css += `    radial-gradient(80% 60% at 50% -10%, rgba(56,189,248,.15), transparent 50%),\n`;
          css += `    radial-gradient(60% 50% at 80% 0, rgba(217,70,239,.12), transparent 60%),\n`;
        }
        css += `    url('${baseUrl}${selectedBackground}');\n`;
        css += `  background-repeat: no-repeat, no-repeat, repeat;\n`;
        css += `  background-size: 1200px 700px, 900px 600px, ${tileSize}px ${tileSize}px;\n`;
        css += `  background-position: center top, right top, 0 0;\n`;
      } else {
        css += `  background-image: url('${baseUrl}${selectedBackground}');\n`;
        css += `  background-repeat: repeat;\n`;
        css += `  background-size: ${tileSize}px ${tileSize}px;\n`;
        css += `  background-position: 0 0;\n`;
      }
      css += `}\n\n`;
      
      if (animationEnabled) {
        css += `.party-bg.animate {\n`;
        css += `  animation: tile-drift ${animationSpeed}s linear infinite;\n`;
        css += `  will-change: background-position;\n`;
        css += `}\n\n`;
        css += `@keyframes tile-drift {\n`;
        css += `  from { background-position: center top, right top, 0 0; }\n`;
        css += `  to   { background-position: center top, right top, -${tileSize}px -${tileSize}px; }\n`;
        css += `}\n`;
      }
    }
    
    return css;
  }, [customColor, multiLayerMode, layerCount, tileSize, animationSpeed, selectedBackground, animationEnabled, showGradients, showHeroGlow]);

  const [currentCSS, setCurrentCSS] = useState(generateCSS());

  // Reset function to restore original values
  const resetToDefaults = () => {
    setSelectedBackground(originalValues.current.selectedBackground);
    setAnimationEnabled(originalValues.current.animationEnabled);
    setAnimationSpeed(originalValues.current.animationSpeed);
    setTileSize(originalValues.current.tileSize);
    setCustomColor(originalValues.current.customColor);
    setShowHeroGlow(originalValues.current.showHeroGlow);
    setShowGradients(originalValues.current.showGradients);
    setGradientMask(originalValues.current.gradientMask);
    setMultiLayerMode(originalValues.current.multiLayerMode);
    setLayerCount(originalValues.current.layerCount);
  };

  // Apply function to update CSS
  const applyChanges = () => {
    const newCSS = generateCSS();
    setCurrentCSS(newCSS);
  };

  // Apply styles to preview element
  useEffect(() => {
    if (previewRef.current) {
              setConfettiStyles(previewRef.current, {
          tileSize,
          animationDuration: animationSpeed,
          backgroundColor: customColor,
          selectedBackground,
          gradientMask
        });
    }
      }, [selectedBackground, animationEnabled, animationSpeed, tileSize, customColor, gradientMask, setConfettiStyles]);

  useEffect(() => {
    setCurrentCSS(generateCSS());
  }, [generateCSS, selectedBackground, animationEnabled, animationSpeed, tileSize, customColor, gradientMask]);

  // Cleanup on unmount - simplified since we removed the complex cleanup system
  useEffect(() => {
    const element = previewRef.current;
    return () => {
      if (element) {
        // Just remove the animation class
        element.className = element.className.replace(/animate-tile-\w+/g, '');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold">🎉 Confetti Pack Test Suite</h1>
            <p className="text-gray-300 mt-2">
              Test and customize confetti backgrounds and animations
            </p>
          </div>
          
          {/* Navigation Bar */}
          <div className="flex gap-2 justify-center">
            <Link 
              href="/confetti-test"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              🏠 Main
            </Link>
            <Link 
              href="/confetti-test/individual"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
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
                <h2 className="text-2xl font-semibold">👀 Preview</h2>
                
                {/* Live Preview */}
                <div className="relative overflow-hidden rounded-lg border border-gray-600" style={{ minHeight: '600px' }}>
                  {/* Animated Background Layer */}
                  <div 
                    ref={previewRef}
                    className={`${getBackgroundClasses(showGradients, showHeroGlow, gradientMask)} ${animationEnabled ? getAnimationClass('fall-down') : ''}`}
                    style={{ 
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1
                    }}
                  />
                  
                  {/* Static Information Overlay - Completely Separate Layer */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="text-center pointer-events-auto">
                      <div className="room-code-glow bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-xl text-2xl font-mono font-bold mb-3">
                        CONFETTI TEST
                      </div>
                      <div className="text-sm text-gray-300 space-y-1 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <div>Pattern: {selectedBackground}</div>
                        <div>Animation: {animationEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div>Speed: {animationSpeed}s</div>
                        <div>Tile Size: {tileSize}px</div>
                        <div>Mask: {gradientMask.charAt(0).toUpperCase() + gradientMask.slice(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restart Animation Button - Below Preview */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (previewRef.current) {
                        // Force a complete restart by reapplying styles
                        const element = previewRef.current;
                        
                        // Remove all animation classes first
                        element.classList.remove('animate-tile-drift', 'animate-tile-fall', 'animate-tile-fall-down', 'animate-tile-bounce', 'animate-tile-pulse', 'animate-tile-wave', 'animate-tile-spiral', 'animate-tile-float');
                        
                        // Force reflow
                        void element.offsetHeight;
                        
                        // Reapply the current animation class
                        if (animationEnabled) {
                          element.classList.add(getAnimationClass('fall-down'));
                        }
                        
                        // Force a complete style refresh by temporarily removing and re-adding the element
                        const parent = element.parentElement;
                        if (parent) {
                          const clone = element.cloneNode(true) as HTMLDivElement;
                          clone.className = element.className;
                          clone.style.cssText = element.style.cssText;
                          
                          // Replace the element with a clone to force a fresh start
                          parent.replaceChild(clone, element);
                          
                          // Update the ref to point to the new element
                          previewRef.current = clone;
                          
                          // Reapply confetti styles to the new element
                          setConfettiStyles(clone, {
                            backgroundColor: customColor,
                            selectedBackground,
                            tileSize,
                            animationDuration: animationSpeed,
                            gradientMask
                          });
                        }
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
                    disabled={!animationEnabled}
                  >
                    <span>🔄</span>
                    Restart Animation
                  </button>
                </div>

                {/* CSS Output */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Generated CSS</h3>
                  <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto text-green-400">
                    <code>{currentCSS}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">🎛️ Quick Controls</h2>
                
                {/* Compact Controls Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Background Pattern */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Pattern</label>
                    <select 
                      value={selectedBackground}
                      onChange={(e) => setSelectedBackground(e.target.value)}
                      className="w-full max-w-[200px] bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {confettiOptions.map((option) => (
                        <option key={option.file} value={option.file}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Animation Speed */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Speed: {animationSpeed}s</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      className="w-full max-w-[200px] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Tile Size */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Size: {tileSize}px</label>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="20"
                      value={tileSize}
                      onChange={(e) => setTileSize(Number(e.target.value))}
                      className="w-full max-w-[200px] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-full max-w-[100px] h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggle Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="animationEnabled"
                        checked={animationEnabled}
                        onChange={(e) => setAnimationEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="animationEnabled" className="text-sm">Animation</label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showHeroGlow"
                        checked={showHeroGlow}
                        onChange={(e) => setShowHeroGlow(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="showHeroGlow" className="text-sm">Hero Glow</label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showGradients"
                        checked={showGradients}
                        onChange={(e) => setShowGradients(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="showGradients" className="text-sm">Gradients</label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="multiLayerMode"
                        checked={multiLayerMode}
                        onChange={(e) => setMultiLayerMode(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="multiLayerMode" className="text-sm">Parallax</label>
                    </div>
                  </div>
                </div>

                {/* Advanced Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fade Effect</label>
                    <select
                      value={gradientMask}
                      onChange={(e) => setGradientMask(e.target.value as 'none' | 'subtle' | 'normal' | 'strong')}
                      className="w-full max-w-[200px] bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="none">None</option>
                      <option value="subtle">Subtle</option>
                      <option value="normal">Normal</option>
                      <option value="strong">Strong</option>

                    </select>
                  </div>
                  
                  {multiLayerMode && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Layers: {layerCount}</label>
                      <input
                        type="range"
                        min="2"
                        max="6"
                        step="1"
                        value={layerCount}
                        onChange={(e) => setLayerCount(Number(e.target.value))}
                        className="w-full max-w-[200px] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
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
                <p className="text-gray-300">Performance monitoring components removed during simplification.</p>
              </div>
            )}


          </div>
        </div>


      </div>

      {/* CSS is now handled by confetti-animations.css and useConfettiStyles hook */}
    </div>
  );
}
