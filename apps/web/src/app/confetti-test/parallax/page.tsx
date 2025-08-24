'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useConfettiStyles } from '../hooks/useConfettiStyles';
import { 
  PageHeader, 
  TabLayout, 
  PreviewArea, 
  ActionButtons, 
  CodeModal,
  ControlsOverlay 
} from '../components/layouts';
import { 
  RangeControl, 
  SelectControl, 
  ColorControl, 
  CheckboxControl 
} from '../components/controls';
import '../styles/confetti-animations.css';

interface ConfettiLayer {
  id: string;
  pattern: string;
  size: number;
  speed: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  enabled: boolean;
}

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
    description: 'Colorful confetti sprinkles',
    colors: ['#ffd166', '#ffb3ba', '#6ee7ff', '#ff7ab6']
  },
  { 
    name: 'Balloons', 
    file: 'confetti-balloons.svg', 
    description: 'Floating balloons with strings',
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
    description: 'Celebratory party hats',
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
    description: 'Shimmering sparkles and glitter',
    colors: ['#FCD34D', '#F472B6', '#60A5FA', '#34D399']
  },
  { 
    name: 'Tile Pattern', 
    file: 'confetti-tile-1.svg', 
    description: 'Geometric tile pattern',
    colors: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB']
  },
];

const defaultLayers: ConfettiLayer[] = [
  {
    id: 'layer-1',
    pattern: 'confetti-sprinkles.svg',
    size: 280,
    speed: 20,
    opacity: 0.8,
    offsetX: 0,
    offsetY: 0,
    enabled: true
  },
  {
    id: 'layer-2',
    pattern: 'confetti-balloons.svg',
    size: 200,
    speed: 15,
    opacity: 0.6,
    offsetX: 50,
    offsetY: 100,
    enabled: true
  },
  {
    id: 'layer-3',
    pattern: 'confetti-sparkles.svg',
    size: 150,
    speed: 25,
    opacity: 0.4,
    offsetX: -30,
    offsetY: 200,
    enabled: true
  }
];

export default function ParallaxTestPage() {
  const [layers, setLayers] = useState<ConfettiLayer[]>(defaultLayers);
  const [backgroundColor, setBackgroundColor] = useState('#0b0f1a');
  const [showHeroGlow, setShowHeroGlow] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [fallingDirection, setFallingDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [fadeOutDistance, setFadeOutDistance] = useState(100);
  const [windEffect, setWindEffect] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'controls' | 'performance'>('preview');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const { setConfettiStyles, getBackgroundClasses } = useConfettiStyles();

  // Store original values for reset functionality
  const originalValues = useRef({
    layers: [...defaultLayers],
    backgroundColor: '#0b0f1a',
    showHeroGlow: true,
    animationEnabled: true,
    fallingDirection: 'down' as const,
    fadeOutDistance: 100,
    windEffect: 0
  });

  // Generate CSS code based on current settings
  const generateCSSCode = () => {
    const enabledLayers = layers.filter(l => l.enabled);
    
    let css = `/* Parallax Confetti CSS */\n`;
    css += `.confetti-container {\n`;
    css += `  position: relative;\n`;
    css += `  overflow: hidden;\n`;
    css += `  background-color: ${backgroundColor};\n`;
    css += `  min-height: 700px;\n`;
    css += `}\n\n`;
    
    enabledLayers.forEach((layer, index) => {
      const confettiOption = confettiOptions.find(opt => opt.file === layer.pattern);
      css += `/* Layer ${index + 1}: ${confettiOption?.name || layer.pattern} */\n`;
      css += `.confetti-layer-${index + 1} {\n`;
      css += `  position: absolute;\n`;
      css += `  inset: 0;\n`;
      css += `  background-image: url('/confetti-pack/${layer.pattern}');\n`;
      css += `  background-size: ${layer.size}px;\n`;
      css += `  background-repeat: repeat;\n`;
      css += `  opacity: ${layer.opacity};\n`;
      css += `  transform: translate(${layer.offsetX}px, ${layer.offsetY}px);\n`;
      css += `  animation: confetti-fall-${index + 1} ${layer.speed}s linear infinite;\n`;
      css += `}\n\n`;
      
      css += `@keyframes confetti-fall-${index + 1} {\n`;
      css += `  0% {\n`;
      css += `    transform: translate(${layer.offsetX}px, ${layer.offsetY}px) translateY(-100%);\n`;
      css += `  }\n`;
      css += `  100% {\n`;
      css += `    transform: translate(${layer.offsetX}px, ${layer.offsetY}px) translateY(100vh);\n`;
      css += `  }\n`;
      css += `}\n\n`;
    });
    
    if (showHeroGlow) {
      css += `/* Hero Glow Effect */\n`;
      css += `.hero-glow {\n`;
      css += `  position: absolute;\n`;
      css += `  inset: 0;\n`;
      css += `  background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);\n`;
      css += `  pointer-events: none;\n`;
      css += `}\n\n`;
    }
    
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

  // Reset to defaults function
  const resetToDefaults = () => {
    setLayers([...originalValues.current.layers]);
    setBackgroundColor(originalValues.current.backgroundColor);
    setShowHeroGlow(originalValues.current.showHeroGlow);
    setAnimationEnabled(originalValues.current.animationEnabled);
    setFallingDirection(originalValues.current.fallingDirection);
    setFadeOutDistance(originalValues.current.fadeOutDistance);
    setWindEffect(originalValues.current.windEffect);
  };

  // Apply changes function
  const applyChanges = () => {
    if (previewRef.current) {
      setConfettiStyles(previewRef.current, {
        backgroundColor,
        selectedBackground: layers[0]?.pattern || 'confetti-sprinkles.svg',
        tileSize: layers[0]?.size || 280,
        animationDuration: layers[0]?.speed || 20,
        gradientMask: 'none'
      });
    }
  };

  // Update layer function
  const updateLayer = (id: string, updates: Partial<ConfettiLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  // Toggle layer function
  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, enabled: !layer.enabled } : layer
    ));
  };

  // Add new layer function
  const addLayer = () => {
    const newLayer: ConfettiLayer = {
      id: `layer-${Date.now()}`,
      pattern: 'confetti-sprinkles.svg',
      size: 200,
      speed: 20,
      opacity: 0.7,
      offsetX: 0,
      offsetY: 0,
      enabled: true
    };
    setLayers(prev => [...prev, newLayer]);
  };

  // Remove layer function
  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
  };

  // Apply styles to preview element
  useEffect(() => {
    if (previewRef.current) {
      setConfettiStyles(previewRef.current, {
        backgroundColor,
        selectedBackground: layers[0]?.pattern || 'confetti-sprinkles.svg',
        tileSize: layers[0]?.size || 280,
        animationDuration: layers[0]?.speed || 20,
        gradientMask: 'none'
      });
    }
  }, [backgroundColor, showHeroGlow, animationEnabled, layers, fallingDirection, fadeOutDistance, windEffect, setConfettiStyles]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PageHeader 
        title="🌊 Parallax Confetti Test"
        description="Test multi-layer parallax confetti effects"
      >
        <Link 
          href="/confetti-test"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          🌊 Parallax
        </Link>
        <Link 
          href="/confetti-test/hero-glow"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          ✨ Hero Glow
        </Link>
      </PageHeader>

      <div className="max-w-7xl mx-auto p-6">
        <TabLayout
          tabs={[
            {
              id: 'preview',
              label: 'Preview',
              icon: '👀',
              content: (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">👀 Preview</h2>
                    <ActionButtons 
                      buttons={[
                        {
                          onClick: () => setShowCodeModal(true),
                          icon: '</>',
                          variant: 'success',
                          title: 'View Generated Code'
                        },
                        {
                          onClick: resetToDefaults,
                          icon: '🔄',
                          variant: 'primary',
                          title: 'Reset to Defaults'
                        },
                        {
                          onClick: applyChanges,
                          icon: '✅',
                          variant: 'secondary',
                          title: 'Apply Changes'
                        }
                      ]}
                    />
                  </div>
                  
                  {/* Live Preview */}
                  <PreviewArea minHeight={700}>
                    <div 
                      ref={previewRef}
                      className={`${getBackgroundClasses(showHeroGlow, showHeroGlow, 'none')}`}
                      style={{ 
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                        backgroundColor
                      }}
                    />
                    
                    {/* Static Information Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="text-center pointer-events-auto">
                        <div className="room-code-glow bg-gray-800/80 backdrop-blur-sm px-8 py-4 rounded-xl text-3xl font-mono font-bold mb-4">
                          PARALLAX TEST
                        </div>
                        <div className="text-sm text-gray-300 space-y-1 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                          <div>Layers: {layers.filter(l => l.enabled).length}</div>
                          <div>Direction: {fallingDirection}</div>
                          <div>Background: {backgroundColor}</div>
                          <div>Animation: {animationEnabled ? 'Enabled' : 'Disabled'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Right Controls Overlay */}
                    <div className="absolute top-4 right-4 z-30">
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

                    {/* Controls Panel Overlay */}
                    <ControlsOverlay
                      isOpen={showControls}
                      onClose={() => setShowControls(false)}
                      sections={[
                        {
                          title: 'Essential',
                          icon: '🚀',
                          color: 'text-blue-400',
                          children: (
                            <>
                              <SelectControl
                                label="Falling Direction"
                                value={fallingDirection}
                                options={[
                                  { value: 'down', label: 'Down' },
                                  { value: 'up', label: 'Up' },
                                  { value: 'left', label: 'Left' },
                                  { value: 'right', label: 'Right' }
                                ]}
                                onChange={(value) => setFallingDirection(value as 'down' | 'up' | 'left' | 'right')}
                              />
                              <CheckboxControl
                                label="Animation Enabled"
                                checked={animationEnabled}
                                onChange={setAnimationEnabled}
                              />
                              <CheckboxControl
                                label="Show Hero Glow"
                                checked={showHeroGlow}
                                onChange={setShowHeroGlow}
                              />
                            </>
                          )
                        },
                        {
                          title: 'Timing',
                          icon: '⏱️',
                          color: 'text-green-400',
                          children: (
                            <>
                              <RangeControl
                                label="Fade Out Distance"
                                value={fadeOutDistance}
                                min={50}
                                max={300}
                                step={10}
                                onChange={setFadeOutDistance}
                                unit="px"
                              />
                              <RangeControl
                                label="Wind Effect"
                                value={windEffect}
                                min={-50}
                                max={50}
                                step={5}
                                onChange={setWindEffect}
                                unit="px"
                              />
                            </>
                          )
                        },
                        {
                          title: 'Visual',
                          icon: '🎨',
                          color: 'text-purple-400',
                          children: (
                            <>
                              <ColorControl
                                label="Background Color"
                                value={backgroundColor}
                                onChange={setBackgroundColor}
                              />
                            </>
                          )
                        }
                      ]}
                    />
                  </PreviewArea>
                </div>
              )
            },
            {
              id: 'controls',
              label: 'Controls',
              icon: '🎛️',
              content: (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">🎛️ Controls</h2>
                  
                  {/* Global Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Global Settings</h3>
                      
                      <ColorControl
                        label="Background Color"
                        value={backgroundColor}
                        onChange={setBackgroundColor}
                      />

                      <CheckboxControl
                        label="Show Hero Glow"
                        checked={showHeroGlow}
                        onChange={setShowHeroGlow}
                      />

                      <CheckboxControl
                        label="Enable Animation"
                        checked={animationEnabled}
                        onChange={setAnimationEnabled}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Animation Settings</h3>
                      
                      <SelectControl
                        label="Falling Direction"
                        value={fallingDirection}
                        options={[
                          { value: 'down', label: 'Down' },
                          { value: 'up', label: 'Up' },
                          { value: 'left', label: 'Left' },
                          { value: 'right', label: 'Right' }
                        ]}
                        onChange={(value) => setFallingDirection(value as 'down' | 'up' | 'left' | 'right')}
                      />

                      <RangeControl
                        label="Fade Out Distance"
                        value={fadeOutDistance}
                        min={50}
                        max={300}
                        step={10}
                        onChange={setFadeOutDistance}
                        unit="px"
                      />

                      <RangeControl
                        label="Wind Effect"
                        value={windEffect}
                        min={-50}
                        max={50}
                        step={5}
                        onChange={setWindEffect}
                        unit="px"
                      />
                    </div>
                  </div>

                  {/* Layer Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Layer Management</h3>
                      <button
                        onClick={addLayer}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
                      >
                        + Add Layer
                      </button>
                    </div>

                    <div className="space-y-4">
                      {layers.map((layer) => (
                        <div key={layer.id} className="bg-gray-700 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <CheckboxControl
                                label={`Layer ${layer.id}`}
                                checked={layer.enabled}
                                onChange={() => toggleLayer(layer.id)}
                              />
                            </div>
                            <button
                              onClick={() => removeLayer(layer.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition-colors"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectControl
                              label="Pattern"
                              value={layer.pattern}
                              options={confettiOptions.map(option => ({
                                value: option.file,
                                label: option.name
                              }))}
                              onChange={(value) => updateLayer(layer.id, { pattern: value })}
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <RangeControl
                                label="Size"
                                value={layer.size}
                                min={50}
                                max={500}
                                step={10}
                                onChange={(value) => updateLayer(layer.id, { size: value })}
                                unit="px"
                              />

                              <RangeControl
                                label="Speed"
                                value={layer.speed}
                                min={5}
                                max={60}
                                step={5}
                                onChange={(value) => updateLayer(layer.id, { speed: value })}
                                unit="s"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <RangeControl
                                label="Opacity"
                                value={layer.opacity}
                                min={0.1}
                                max={1}
                                step={0.1}
                                onChange={(value) => updateLayer(layer.id, { opacity: value })}
                                unit="%"
                              />

                              <RangeControl
                                label="Offset X"
                                value={layer.offsetX}
                                min={-200}
                                max={200}
                                step={10}
                                onChange={(value) => updateLayer(layer.id, { offsetX: value })}
                                unit="px"
                              />
                            </div>

                            <RangeControl
                              label="Offset Y"
                              value={layer.offsetY}
                              min={-200}
                              max={200}
                              step={10}
                              onChange={(value) => updateLayer(layer.id, { offsetY: value })}
                              unit="px"
                            />
                          </div>
                        </div>
                      ))}
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
              )
            },
            {
              id: 'performance',
              label: 'Performance',
              icon: '📊',
              content: (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">📊 Performance</h2>
                  <p className="text-gray-300">Performance monitoring tools will be added here.</p>
                </div>
              )
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'preview' | 'controls' | 'performance')}
        />
      </div>

      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onCopy={copyToClipboard}
        title="💻 Generated CSS Code"
        code={generateCSSCode()}
      />
    </div>
  );
}
