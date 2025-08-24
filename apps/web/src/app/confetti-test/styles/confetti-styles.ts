import { css, keyframes } from '@emotion/react';

// Keyframe animations
export const tileDrift = keyframes`
  from { 
    background-position: center top, right top, 0 0; 
  }
  to { 
    background-position: center top, right top, -280px -280px; 
  }
`;

export const tileFall = keyframes`
  0% { 
    background-position: center top, right top, 0 0; 
    opacity: 1;
    transform: translateY(0px);
  }
  70% { 
    background-position: center top, right top, -140px -140px; 
    opacity: 0.8;
    transform: translateY(50px);
  }
  100% { 
    background-position: center top, right top, -280px -280px; 
    opacity: 0;
    transform: translateY(100px);
  }
`;

export const tileBounce = keyframes`
  0%, 100% { 
    background-position: center top, right top, 0 0; 
    transform: translateY(0px); 
  }
  25% { 
    background-position: center top, right top, -140px -140px; 
    transform: translateY(-20px); 
  }
  50% { 
    background-position: center top, right top, -280px -280px; 
    transform: translateY(0px); 
  }
  75% { 
    background-position: center top, right top, -420px -420px; 
    transform: translateY(0px); 
  }
`;

export const tilePulse = keyframes`
  0%, 100% { 
    background-position: center top, right top, 0 0; 
    transform: scale(1); 
  }
  50% { 
    background-position: center top, right top, -140px -140px; 
    transform: scale(1.05); 
  }
`;

export const tileWave = keyframes`
  0%, 100% { 
    background-position: center top, right top, 0 0; 
  }
  25% { 
    background-position: center top, right top, -140px 0px; 
  }
  50% { 
    background-position: center top, right top, -280px 0px; 
  }
  75% { 
    background-position: center top, right top, -420px 0px; 
  }
`;

export const tileSpiral = keyframes`
  0% { 
    background-position: center top, right top, 0 0; 
    transform: rotate(0deg); 
  }
  100% { 
    background-position: center top, right top, -280px -280px; 
    transform: rotate(360deg); 
  }
`;

export const tileFloat = keyframes`
  0%, 100% { 
    background-position: center top, right top, 0 0; 
    transform: translateY(0px); 
  }
  50% { 
    background-position: center top, right top, -140px -140px; 
    transform: translateY(-15px); 
  }
`;

export const glow = keyframes`
  0%, 100% { opacity: .5; }
  50% { opacity: .9; }
`;

// Base styles
export const partyBackground = (props: {
  backgroundColor: string;
  showHeroGlow: boolean;
  showGradients: boolean;
  selectedBackground: string;
  tileSize: number;
}) => css`
  background-color: ${props.backgroundColor};
  
  ${props.showGradients && props.showHeroGlow ? css`
    background-image: 
      radial-gradient(80% 60% at 50% -10%, rgba(56,189,248,.15), transparent 50%),
      radial-gradient(60% 50% at 80% 0, rgba(217,70,239,.12), transparent 60%),
      url('/confetti-pack/${props.selectedBackground}');
    background-repeat: no-repeat, no-repeat, repeat;
    background-size: 1200px 700px, 900px 600px, ${props.tileSize}px ${props.tileSize}px;
    background-position: center top, right top, 0 0;
  ` : props.showGradients ? css`
    background-image: 
      radial-gradient(80% 60% at 50% -10%, rgba(56,189,248,.15), transparent 50%),
      url('/confetti-pack/${props.selectedBackground}');
    background-repeat: no-repeat, repeat;
    background-size: 1200px 700px, ${props.tileSize}px ${props.tileSize}px;
    background-position: center top, 0 0;
  ` : css`
    background-image: url('/confetti-pack/${props.selectedBackground}');
    background-repeat: repeat;
    background-size: ${props.tileSize}px ${props.tileSize}px;
    background-position: 0 0;
  `}
`;

// Animation styles
export const partyBackgroundAnimated = (props: {
  animationType: string;
  duration: number;
  easing: string;
  direction: string;
  iterationCount: string;
}) => {
  const getAnimation = () => {
    switch (props.animationType) {
      case 'fall': return tileFall;
      case 'drift': return tileDrift;
      case 'bounce': return tileBounce;
      case 'pulse': return tilePulse;
      case 'wave': return tileWave;
      case 'spiral': return tileSpiral;
      case 'float': return tileFloat;
      default: return tileDrift;
    }
  };

  return css`
    animation: ${getAnimation()} ${props.duration}s ${props.easing} ${props.iterationCount} ${props.direction};
    will-change: background-position, transform;
  `;
};

// Multi-layer styles
export const multiLayerContainer = (props: {
  backgroundColor: string;
  showHeroGlow: boolean;
  layerCount: number;
}) => css`
  background-color: ${props.backgroundColor};
  ${props.showHeroGlow ? css`
    background-image: radial-gradient(80% 60% at 50% -10%, rgba(56,189,248,.15), transparent 50%);
    background-repeat: no-repeat;
    background-size: 1200px 700px;
    background-position: center top;
  ` : ''}
  position: relative;
  overflow: hidden;
`;

export const confettiLayer = (props: {
  index: number;
  pattern: string;
  size: number;
  speed: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  fallingDirection: string;
  fadeOutDistance: number;
  windEffect: number;
}) => {
  const getFallAnimation = () => {
    const direction = props.fallingDirection;
    let transformX = 0;
    let transformY = 0;
    
    switch (direction) {
      case 'down':
        transformY = `calc(100vh + ${props.size}px)`;
        transformX = `${props.windEffect * props.speed * 0.1}px`;
        break;
      case 'up':
        transformY = `calc(-100vh - ${props.size}px)`;
        transformX = `${props.windEffect * props.speed * 0.1}px`;
        break;
      case 'left':
        transformX = `calc(-100vw - ${props.size}px)`;
        transformY = `${props.windEffect * props.speed * 0.1}px`;
        break;
      case 'right':
        transformX = `calc(100vw + ${props.size}px)`;
        transformY = `${props.windEffect * props.speed * 0.1}px`;
        break;
    }
    
    return keyframes`
      0% {
        transform: translate(${props.offsetX}px, ${props.offsetY}px);
        opacity: ${props.opacity};
      }
      ${100 - props.fadeOutDistance}% {
        transform: translate(${props.offsetX}px, ${props.offsetY}px);
        opacity: ${props.opacity};
      }
      100% {
        transform: translate(${props.offsetX + (direction === 'left' || direction === 'right' ? transformX : 0)}px, ${props.offsetY + (direction === 'up' || direction === 'down' ? transformY : 0)}px);
        opacity: 0;
      }
    `;
  };

  return css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/confetti-pack/${props.pattern}');
    background-repeat: repeat;
    background-size: ${props.size}px ${props.size}px;
    opacity: ${props.opacity};
    transform: translate(${props.offsetX}px, ${props.offsetY}px);
    z-index: ${-props.index - 1};
    animation: ${getFallAnimation()} ${props.speed}s linear infinite;
  `;
};

// Room code glow effect
export const roomCodeGlow = css`
  position: relative;
  isolation: isolate;
  
  &::before {
    content: "";
    position: absolute;
    inset: -16px;
    border-radius: 18px;
    background: radial-gradient(60% 60% at 50% 50%, rgba(99,102,241,.35), transparent 70%);
    filter: blur(8px);
    z-index: -1;
    opacity: .75;
    animation: ${glow} 3.6s ease-in-out infinite;
  }
`;

// Utility styles
export const container = css`
  min-height: 100vh;
  background-color: #111827;
  color: white;
`;

export const header = css`
  background-color: #1f2937;
  border-bottom: 1px solid #374151;
  padding: 1rem;
`;

export const content = css`
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem;
`;

export const card = css`
  background-color: #1f2937;
  border-radius: 0.5rem;
  padding: 1.5rem;
`;

export const button = css`
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1d4ed8;
  }
`;

export const input = css`
  background-color: #374151;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: white;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: #3b82f6;
  }
`;

export const select = css`
  ${input}
  cursor: pointer;
`;

export const range = css`
  width: 100%;
  height: 0.5rem;
  background-color: #374151;
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    background-color: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    background-color: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;
