import { 
  GAME_CONFIGS, 
  getGameConfig, 
  type GameConfig,
  type GamePhaseConfig 
} from '@party/types';

// Game information interface that the frontend expects
export interface GameInfo {
  id: string;
  title: string;
  name: string;
  description: string;
  icon: string;
  players: string;
  duration: string;
  difficulty: string;
  color: string;
  gradient: string;
  minPlayers: number;
  maxPlayers: number;
  phases: GamePhaseConfig[];
  defaultSettings: Record<string, any>;
  uiComponents: string[];
  theme?: {
    primary: string;
    accent: string;
    background: string;
    icon: string;
    name: string;
  };
}

// Application configuration
export const AppConfig = {
  API: {
    ROOMS_ENDPOINT: '/rooms',
    WEBSOCKET_ENDPOINT: '/rooms',
    CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
  },
  GAMES: {
    DEFAULT: 'fibbing-it',
    SUPPORTED: Object.keys(GAME_CONFIGS),
  },
  UI: {
    THEME: 'dark',
    ANIMATIONS: true,
  },
  BACKEND: {
    NEST: {
      PORT: 3001,
      GLOBAL_PREFIX: '',
    },
    WEBSOCKET: {
      NAMESPACE: '/rooms',
      PING_TIMEOUT: 60000,
      PING_INTERVAL: 25000,
    },
  },
} as const;

// API URL configuration
export function getApiUrl(protocol: 'http' | 'ws' = 'http'): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variables or defaults
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return protocol === 'ws' ? baseUrl.replace('http', 'ws') : baseUrl;
  }

  // Client-side: always use the API port for both HTTP and WebSocket
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return protocol === 'ws' ? baseUrl.replace('http', 'ws') : baseUrl;
}

// Get all available games
export function getAllGames(): GameInfo[] {
  return Object.values(GAME_CONFIGS).map(config => ({
    id: config.id,
    title: config.name,
    name: config.name,
    description: config.description,
    icon: getGameIcon(config.id),
    players: `${config.minPlayers}-${config.maxPlayers}`,
    duration: getGameDuration(config.id),
    difficulty: getGameDifficulty(config.id),
    color: getGameColor(config.id),
    gradient: getGameGradient(config.id),
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    phases: config.phases,
    defaultSettings: config.defaultSettings,
    uiComponents: config.uiComponents,
    theme: getGameTheme(config.id),
  }));
}

// Get specific game information
export function getGameInfo(gameId: string): GameInfo | null {
  const config = getGameConfig(gameId);
  if (!config) return null;

  return {
    id: config.id,
    title: config.name,
    name: config.name,
    description: config.description,
    icon: getGameIcon(config.id),
    players: `${config.minPlayers}-${config.maxPlayers}`,
    duration: getGameDuration(config.id),
    difficulty: getGameDifficulty(config.id),
    color: getGameColor(config.id),
    gradient: getGameGradient(config.id),
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    phases: config.phases,
    defaultSettings: config.defaultSettings,
    uiComponents: config.uiComponents,
    theme: getGameTheme(config.id),
  };
}

// Get game icon
function getGameIcon(gameId: string): string {
  const icons: Record<string, string> = {
    'bluff-trivia': '🧠',
    'fibbing-it': '🎭',
    'word-association': '🔗',
  };
  return icons[gameId] || '🎮';
}

// Get game duration
function getGameDuration(gameId: string): string {
  const durations: Record<string, string> = {
    'bluff-trivia': '20-40 min',
    'fibbing-it': '15-30 min',
    'word-association': '10-20 min',
  };
  return durations[gameId] || '15-30 min';
}

// Get game difficulty
function getGameDifficulty(gameId: string): string {
  const difficulties: Record<string, string> = {
    'bluff-trivia': 'Medium',
    'fibbing-it': 'Easy',
    'word-association': 'Easy',
  };
  return difficulties[gameId] || 'Easy';
}

// Get game color
function getGameColor(gameId: string): string {
  const colors: Record<string, string> = {
    'bluff-trivia': 'from-emerald-600 to-teal-600',
    'fibbing-it': 'from-purple-600 to-blue-600',
    'word-association': 'from-orange-600 to-red-600',
  };
  return colors[gameId] || 'from-purple-600 to-blue-600';
}

// Get game gradient
function getGameGradient(gameId: string): string {
  const gradients: Record<string, string> = {
    'bluff-trivia': 'from-emerald-500/20 to-teal-500/20',
    'fibbing-it': 'from-purple-500/20 to-blue-500/20',
    'word-association': 'from-orange-500/20 to-red-500/20',
  };
  return gradients[gameId] || 'from-purple-500/20 to-blue-500/20';
}

// Get game theme colors
function getGameTheme(gameId: string) {
  const themes: Record<string, { primary: string; accent: string; background: string; icon: string; name: string }> = {
    'bluff-trivia': {
      primary: '#3B82F6', // Blue
      accent: '#F59E0B',
      background: '#1E40AF',
      icon: '🧠',
      name: 'Bluff Trivia',
    },
    'fibbing-it': {
      primary: '#10B981', // Green
      accent: '#F59E0B',
      background: '#059669',
      icon: '🎭',
      name: 'Fibbing It',
    },
    'word-association': {
      primary: '#8B5CF6', // Purple
      accent: '#F59E0B',
      background: '#7C3AED',
      icon: '🔗',
      name: 'Word Association',
    },
  };

  return themes[gameId] || themes['fibbing-it'];
}

// Export types for convenience
export type { GameConfig, GamePhaseConfig };

// Re-export utility functions from types package
export { 
  success, 
  failure,
  ErrorCategory
} from '@party/types';

// Re-export types
export type { 
  Result, 
  StandardError
} from '@party/types';

// Error handling utilities
export const createErrorResponse = (
  code: string,
  message: string,
  category: string,
  statusCode: number,
  details?: any,
  context?: string,
  requestId?: string
) => ({
  success: false as const,
  error: {
    code,
    message,
    category: category.toUpperCase(),
    statusCode,
    details,
    timestamp: new Date().toISOString(),
    requestId,
    context,
  },
});

export const createSuccessResponse = <T>(data: T, requestId?: string) => ({
  success: true as const,
  data,
  timestamp: new Date().toISOString(),
  requestId,
});

export const shouldRetry = (category: string): boolean => {
  const retryableCategories = ['SYSTEM', 'NETWORK'];
  return retryableCategories.includes(category.toUpperCase());
};

export const getUserActionRequired = (category: string): boolean => {
  const userActionCategories = ['VALIDATION', 'BUSINESS_LOGIC', 'AUTHENTICATION'];
  return userActionCategories.includes(category.toUpperCase());
};

export const getLogLevel = (category: string): string => {
  const logLevels: Record<string, string> = {
    'VALIDATION': 'warn',
    'BUSINESS_LOGIC': 'warn',
    'SYSTEM': 'error',
    'AUTHENTICATION': 'warn',
    'NETWORK': 'error',
  };
  return logLevels[category.toUpperCase()] || 'error';
};
