'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useConfettiStyles } from '../hooks/useConfettiStyles';
import '../styles/confetti-animations.css';

interface AnimationPreset {
  name: string;
  description: string;
  keyframes: string;
  duration: number;
  timing: string;
  easing: string;
}

const animationPresets: AnimationPreset[] = [
  {
    name: 'Fall Down',
    description: 'Falling straight down from top to bottom',
    keyframes: 'fall-down',
    duration: 30,
    timing: 'ease-in-out',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  {
    name: 'Fall',
    description: 'Falling down with fade out effect',
    keyframes: 'fall',
    duration: 25,
    timing: 'linear',
    easing: 'linear'
  },
  {
    name: 'Drift',
    description: 'Smooth diagonal drift animation',
    keyframes: 'drift',
    duration: 40,
    timing: 'linear',
    easing: 'linear'
  },
  {
    name: 'Bounce',
    description: 'Bouncy up and down movement',
    keyframes: 'bounce',
    duration: 20,
    timing: 'ease-in-out',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  {
    name: 'Pulse',
    description: 'Gentle pulsing scale effect',
    keyframes: 'pulse',
    duration: 15,
    timing: 'ease-in-out',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },
  {
    name: 'Wave',
    description: 'Wave-like horizontal movement',
    keyframes: 'wave',
    duration: 25,
    timing: 'ease-in-out',
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  {
    name: 'Spiral',
    description: 'Spiral rotation effect',
    keyframes: 'spiral',
    duration: 30,
    timing: 'linear',
    easing: 'linear'
  },
  {
    name: 'Float',
    description: 'Gentle floating up and down',
    keyframes: 'float',
    duration: 18,
    timing: 'ease-in-out',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
];

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

export default function AnimationTestPage() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [customDuration, setCustomDuration] = useState(30);
  const [customEasing, setCustomEasing] = useState('linear');
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [tileSize, setTileSize] = useState(280);
  const [showHeroGlow, setShowHeroGlow] = useState(true);
  const [showGradients, setShowGradients] = useState(true);
  const [gradientMask, setGradientMask] = useState<'none' | 'subtle' | 'normal' | 'strong'>('normal');
  const [backgroundColor, setBackgroundColor] = useState('#0b0f1a');
  const [animationDirection, setAnimationDirection] = useState<'normal' | 'reverse' | 'alternate' | 'alternate-reverse'>('normal');
  const [animationIterationCount] = useState('infinite');
  const [showControls, setShowControls] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const currentPreset = animationPresets[selectedPreset];
  const currentPattern = confettiPatterns[selectedPattern];
  const previewRef = useRef<HTMLDivElement>(null);
  const { setConfettiStyles, getAnimationClass, getBackgroundClasses } = useConfettiStyles();
  
  // Apply styles to preview element
  useEffect(() => {
    if (previewRef.current) {
      setConfettiStyles(previewRef.current, {
        tileSize,
        animationDuration: customDuration,
        backgroundColor,
        selectedBackground: currentPattern,
        gradientMask
      });
    }
  }, [selectedPattern, customDuration, tileSize, backgroundColor, gradientMask, setConfettiStyles, currentPattern]);

  // Apply animation class when preset changes
  useEffect(() => {
    if (previewRef.current) {
      // Remove all previous animation classes
      previewRef.current.className = previewRef.current.className.replace(/animate-tile-\w+/g, '');
      
      // Add the new animation class if enabled
      if (animationEnabled) {
        previewRef.current.classList.add(getAnimationClass(currentPreset.keyframes));
      }
    }
  }, [currentPreset, animationEnabled, getAnimationClass]);

  // Restart animation function
  const restartAnimation = () => {
    if (previewRef.current) {
      // Clone the element to force a complete restart
      const element = previewRef.current;
      const clone = element.cloneNode(true) as HTMLDivElement;
      element.parentNode?.replaceChild(clone, element);
      
      // Update the ref to point to the new element
      previewRef.current = clone;
      
      // Reapply styles and animation
      setConfettiStyles(clone, {
        tileSize,
        animationDuration: customDuration,
        backgroundColor,
        selectedBackground: currentPattern,
        gradientMask
      });
      
      if (animationEnabled) {
        clone.classList.add(getAnimationClass(currentPreset.keyframes));
      }
    }
  };

  const generateKeyframes = (preset: AnimationPreset) => {
    const size = tileSize;
    switch (preset.keyframes) {
      case 'fall':
        return `
          @keyframes tile-fall {
            0% { 
              background-position: center top, right top, 0 0; 
              opacity: 1;
              transform: translateY(0px);
            }
            70% { 
              background-position: center top, right top, -${size/2}px -${size/2}px; 
              opacity: 0.8;
              transform: translateY(50px);
            }
            100% { 
              background-position: center top, right top, -${size}px -${size}px; 
              opacity: 0;
              transform: translateY(100px);
            }
          }
        `;
      case 'drift':
        return `
          @keyframes tile-drift {
            from { background-position: center top, right top, 0 0; }
            to   { background-position: center top, right top, -${size}px -${size}px; }
          }
        `;
      case 'bounce':
        return `
          @keyframes tile-bounce {
            0%, 100% { background-position: center top, right top, 0 0; transform: translateY(0px); }
            25% { background-position: center top, right top, -${size/2}px -${size/2}px; transform: translateY(-20px); }
            50% { background-position: center top, right top, -${size}px -${size}px; transform: translateY(0px); }
            75% { background-position: center top, right top, -${size*1.5}px -${size*1.5}px; transform: translateY(0px); }
          }
        `;
      case 'pulse':
        return `
          @keyframes tile-pulse {
            0%, 100% { background-position: center top, right top, 0 0; transform: scale(1); }
            50% { background-position: center top, right top, -${size/2}px -${size/2}px; transform: scale(1.05); }
          }
        `;
      case 'wave':
        return `
          @keyframes tile-wave {
            0%, 100% { background-position: center top, right top, 0 0; }
            25% { background-position: center top, right top, -${size/2}px 0px; }
            50% { background-position: center top, right top, -${size}px 0px; }
            75% { background-position: center top, right top, -${size*1.5}px 0px; }
          }
        `;
      case 'spiral':
        return `
          @keyframes tile-spiral {
            0% { background-position: center top, right top, 0 0; transform: rotate(0deg); }
            100% { background-position: center top, right top, -${size}px -${size}px; transform: rotate(360deg); }
          }
        `;
      case 'float':
        return `
          @keyframes tile-float {
            0%, 100% { background-position: center top, right top, 0 0; transform: translateY(0px); }
            50% { background-position: center top, right top, -${size/2}px -${size/2}px; transform: translateY(-15px); }
          }
        `;
      default:
        return '';
    }
  };

  const getAnimationName = (preset: AnimationPreset) => {
    return `tile-${preset.keyframes}`;
  };

  const getAnimationCSS = () => {
    const preset = animationPresets[selectedPreset];
    const animationName = getAnimationName(preset);
    const duration = customDuration;
    const easing = customEasing;
    
    return `
      .party-bg.animate {
        animation: ${animationName} ${duration}s ${easing} ${animationIterationCount} ${animationDirection};
        will-change: background-position, transform;
      }
    `;
  };

  // Generate CSS code based on current settings
  const generateCSSCode = () => {
    const preset = animationPresets[selectedPreset];
    const animationName = getAnimationName(preset);
    
    let css = `/* Animation Test CSS */\n`;
    css += `.confetti-container {\n`;
    css += `  position: relative;\n`;
    css += `  overflow: hidden;\n`;
    css += `  background-color: ${backgroundColor};\n`;
    css += `  min-height: 700px;\n`;
    css += `}\n\n`;
    
    css += `/* Background Pattern */\n`;
    css += `.confetti-background {\n`;
    css += `  position: absolute;\n`;
    css += `  inset: 0;\n`;
    css += `  background-image: url('/confetti-pack/${currentPattern}');\n`;
    css += `  background-size: ${tileSize}px;\n`;
    css += `  background-repeat: repeat;\n`;
    css += `  background-position: center top, right top, 0 0;\n`;
    css += `}\n\n`;
    
    if (showGradients) {
      css += `/* Gradient Overlay */\n`;
      css += `.gradient-overlay {\n`;
      css += `  position: absolute;\n`;
      css += `  inset: 0;\n`;
      css += `  background: linear-gradient(45deg, transparent 30%, rgba(0,0,0,0.1) 50%, transparent 70%);\n`;
      css += `  pointer-events: none;\n`;
      css += `}\n\n`;
    }
    
    if (showHeroGlow) {
      css += `/* Hero Glow Effect */\n`;
      css += `.hero-glow {\n`;
      css += `  position: absolute;\n`;
      css += `  inset: 0;\n`;
      css += `  background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);\n`;
      css += `  pointer-events: none;\n`;
      css += `}\n\n`;
    }
    
    css += `/* Animation Class */\n`;
    css += `.confetti-background.animate {\n`;
    css += `  animation: ${animationName} ${customDuration}s ${customEasing} ${animationIterationCount} ${animationDirection};\n`;
    css += `  will-change: background-position, transform;\n`;
    css += `}\n\n`;
    
    // Add the keyframes
    css += generateKeyframes(preset);
    
    return css;
  };

  // Copy CSS to clipboard
  const copyToClipboard = async () => {
    try {
      const cssCode = generateCSSCode();
      await navigator.clipboard.writeText(cssCode);
      alert('CSS copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy CSS:', err);
      alert('Failed to copy CSS to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎬 Animation Test Suite</h1>
            <p className="text-gray-300 mt-1">Test different animation effects and timing</p>
          </div>
          <Link 
            href="/confetti-test"
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Main
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Full Width Preview with Overlay Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-2xl font-semibold mb-4">👀 Live Animation Preview</h3>
          
          <div className="relative overflow-hidden rounded-lg border border-gray-600 bg-gray-900" style={{ minHeight: '700px' }}>
            {/* Animated Background Layer */}
            <div 
              ref={previewRef}
              className={`${getBackgroundClasses(showGradients, showHeroGlow, gradientMask)}`}
              style={{ 
                position: 'absolute',
                inset: 0,
                zIndex: 1
              }}
            />
            
            {/* Static Information Overlay - Completely Separate Layer */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="text-center pointer-events-auto">
                <div className="room-code-glow bg-gray-800/80 backdrop-blur-sm px-8 py-4 rounded-xl text-3xl font-mono font-bold mb-4">
                  {currentPreset.name.toUpperCase()}
                </div>
                <div className="text-sm text-gray-300 space-y-1 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div>Pattern: {currentPattern}</div>
                  <div>Animation: {currentPreset.name}</div>
                  <div>Duration: {customDuration}s</div>
                  <div>Easing: {customEasing}</div>
                  <div>Direction: {animationDirection}</div>
                  <div>Tile Size: {tileSize}px</div>
                  <div>Mask: {gradientMask.charAt(0).toUpperCase() + gradientMask.slice(1)}</div>
                </div>
              </div>
            </div>

            {/* Top Right Controls Overlay */}
            <div className="absolute top-4 right-4 z-30 flex items-center space-x-3">
              {/* Code Button */}
              <button
                onClick={() => setShowCodeModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-lg"
                title="View Generated Code"
              >
                &lt;/&gt;
              </button>
              
              {/* Gear Icon Button */}
              <button
                onClick={() => setShowControls(!showControls)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors shadow-lg"
                title="Animation Controls"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Top Left Restart Button */}
            <div className="absolute top-4 left-4 z-30">
              <button
                onClick={restartAnimation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-lg"
                title="Restart Animation"
              >
                🔄 Restart
              </button>
            </div>

            {/* Controls Panel Overlay */}
            {showControls && (
              <div className="absolute top-16 right-4 z-40 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 max-w-sm w-80 shadow-2xl border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">🎛️ Controls</h4>
                  <button
                    onClick={() => setShowControls(false)}
                    className="text-gray-400 hover:text-white text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Progressive Controls Layout */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Level 1: Essential Controls */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold mb-3 text-blue-400">🚀 Essential</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Animation Preset</label>
                        <select 
                          value={selectedPreset}
                          onChange={(e) => setSelectedPreset(Number(e.target.value))}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        >
                          {animationPresets.map((preset, index) => (
                            <option key={preset.name} value={index}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Pattern</label>
                        <select 
                          value={selectedPattern}
                          onChange={(e) => setSelectedPattern(Number(e.target.value))}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        >
                          {confettiPatterns.map((pattern, index) => (
                            <option key={pattern} value={index}>
                              {pattern.replace('.svg', '').replace(/-/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Level 2: Timing Controls */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold mb-3 text-green-400">⏱️ Timing</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Duration: {customDuration}s</label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Easing</label>
                        <select
                          value={customEasing}
                          onChange={(e) => setCustomEasing(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="linear">Linear</option>
                          <option value="ease">Ease</option>
                          <option value="ease-in">Ease In</option>
                          <option value="ease-out">Ease Out</option>
                          <option value="ease-in-out">Ease In Out</option>
                          <option value="cubic-bezier(0.68, -0.55, 0.265, 1.55)">Bounce</option>
                          <option value="cubic-bezier(0.4, 0, 0.6, 1)">Smooth</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Direction</label>
                        <select
                          value={animationDirection}
                          onChange={(e) => setAnimationDirection(e.target.value as 'normal' | 'reverse' | 'alternate' | 'alternate-reverse')}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                          <option value="alternate">Alternate</option>
                          <option value="alternate-reverse">Alternate Reverse</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Level 3: Visual Controls */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold mb-3 text-purple-400">🎨 Visual</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tile Size: {tileSize}px</label>
                        <input
                          type="range"
                          min="100"
                          max="500"
                          step="20"
                          value={tileSize}
                          onChange={(e) => setTileSize(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Fade Effect</label>
                        <select
                          value={gradientMask}
                          onChange={(e) => setGradientMask(e.target.value as 'none' | 'subtle' | 'normal' | 'strong')}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="none">None</option>
                          <option value="subtle">Subtle</option>
                          <option value="normal">Normal</option>
                          <option value="strong">Strong</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="animationEnabled"
                            checked={animationEnabled}
                            onChange={(e) => setAnimationEnabled(e.target.checked)}
                            className="w-3 h-3 text-blue-600 bg-gray-600 border-gray-500 rounded"
                          />
                          <label htmlFor="animationEnabled" className="text-xs">Animation</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showHeroGlow"
                            checked={showHeroGlow}
                            onChange={(e) => setShowHeroGlow(e.target.checked)}
                            className="w-3 h-3 text-blue-600 bg-gray-600 border-gray-500 rounded"
                          />
                          <label htmlFor="showHeroGlow" className="text-xs">Hero Glow</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showGradients"
                            checked={showGradients}
                            onChange={(e) => setShowGradients(e.target.checked)}
                            className="w-3 h-3 text-blue-600 bg-gray-600 border-gray-500 rounded"
                          />
                          <label htmlFor="showGradients" className="text-xs">Gradients</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold">💻 Generated CSS Code</h3>
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <span>📋</span>
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
                <code>{generateCSSCode()}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
