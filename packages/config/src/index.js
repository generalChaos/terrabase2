"use strict";
/**
 * Centralized Configuration for Party Game
 *
 * This file contains all configuration values that should be shared
 * across the frontend and backend. It ensures consistency and makes
 * configuration changes easier to manage.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogLevel = exports.getUserActionRequired = exports.shouldRetry = exports.createSuccessResponse = exports.createErrorResponse = exports.getApiUrl = exports.getAllGames = exports.getGameInfo = exports.AppConfig = exports.GameConfig = void 0;
// Re-export core game config from types package
var types_1 = require("@party/types");
Object.defineProperty(exports, "GameConfig", { enumerable: true, get: function () { return types_1.GameConfig; } });
// Environment-specific configuration
exports.AppConfig = {
    // API Configuration
    API: {
        DEFAULT_HTTP_URL: 'http://localhost:3001',
        DEFAULT_WS_URL: 'http://localhost:3001',
        CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
        HEALTH_ENDPOINT: '/health',
        ROOMS_ENDPOINT: '/rooms',
    },
    // Game Information - Single source of truth for all game metadata
    GAMES: {
        'fibbing-it': {
            id: 'fibbing-it',
            title: 'Fibbing It!',
            description: 'Players create answers and vote on the best ones. Can you spot the truth from the lies?',
            players: '3-8',
            duration: '15-30 min',
            difficulty: 'Easy',
            icon: '🎭',
            color: 'from-purple-600 to-blue-600',
            gradient: 'from-purple-500/20 to-blue-500/20',
            theme: {
                primary: 'bg-purple-600',
                accent: 'bg-purple-400',
                background: 'bg-purple-800',
                icon: '🎭',
                name: 'Fibbing It!'
            }
        },
        'bluff-trivia': {
            id: 'bluff-trivia',
            title: 'Bluff Trivia',
            description: 'Classic trivia with bluffing mechanics. Make up answers and see if others believe you!',
            players: '3-10',
            duration: '20-40 min',
            difficulty: 'Medium',
            icon: '🧠',
            color: 'from-emerald-600 to-teal-600',
            gradient: 'from-emerald-500/20 to-teal-500/20',
            theme: {
                primary: 'bg-blue-600',
                accent: 'bg-blue-400',
                background: 'bg-blue-800',
                icon: '🧠',
                name: 'Bluff Trivia'
            }
        },
        'word-association': {
            id: 'word-association',
            title: 'Word Association',
            description: 'Create word associations and vote on the most creative ones. Simple but endlessly fun!',
            players: '3-6',
            duration: '10-20 min',
            difficulty: 'Easy',
            icon: '🔗',
            color: 'from-orange-600 to-red-600',
            gradient: 'from-orange-500/20 to-red-500/20',
            theme: {
                primary: 'bg-teal-600',
                accent: 'bg-teal-400',
                background: 'bg-teal-800',
                icon: '🔗',
                name: 'Word Association'
            }
        }
    },
    // Environment detection helpers
    ENV: {
        isDevelopment: () => process.env.NODE_ENV === 'development',
        isProduction: () => process.env.NODE_ENV === 'production',
        isTest: () => process.env.NODE_ENV === 'test',
    },
    // Frontend-specific configuration
    FRONTEND: {
        // Next.js configuration
        NEXT: {
            STATIC_OPTIMIZATION: true,
            STRICT_MODE: true,
        },
        // Socket.io client configuration
        SOCKET: {
            AUTO_CONNECT: true,
            RECONNECTION: true,
            RECONNECTION_ATTEMPTS: 5,
            RECONNECTION_DELAY: 1000,
            TIMEOUT: 20000,
        },
        // UI Constants
        UI: {
            // Animation durations (in ms)
            ANIMATIONS: {
                FAST: 150,
                NORMAL: 300,
                SLOW: 500,
            },
            // Breakpoints (matching Tailwind)
            BREAKPOINTS: {
                SM: 640,
                MD: 768,
                LG: 1024,
                XL: 1280,
                '2XL': 1536,
            },
        },
    },
    // Backend-specific configuration
    BACKEND: {
        // NestJS configuration
        NEST: {
            PORT: 3001,
            GLOBAL_PREFIX: '',
        },
        // Database configuration
        DATABASE: {
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 3000,
        },
        // WebSocket configuration
        WEBSOCKET: {
            NAMESPACE: '/rooms',
            PING_TIMEOUT: 60000,
            PING_INTERVAL: 25000,
        },
    },
    // Error handling configuration
    ERROR_HANDLING: {
        // Retry configuration
        RETRY: {
            MAX_ATTEMPTS: 3,
            BASE_DELAY_MS: 1000,
            MAX_DELAY_MS: 10000,
            BACKOFF_MULTIPLIER: 2,
        },
        // Logging configuration
        LOGGING: {
            INCLUDE_STACK_TRACE: true,
            INCLUDE_REQUEST_ID: true,
            INCLUDE_CONTEXT: true,
            LOG_LEVEL: 'error', // 'debug' | 'info' | 'warn' | 'error'
        },
        // Error recovery strategies
        RECOVERY: {
            AUTO_RETRY: true,
            GRACEFUL_DEGRADATION: true,
            FALLBACK_BEHAVIOR: true,
        },
        // Error categorization
        CATEGORIES: {
            VALIDATION: {
                RETRYABLE: false,
                USER_ACTION_REQUIRED: true,
                LOG_LEVEL: 'warn',
            },
            BUSINESS_LOGIC: {
                RETRYABLE: false,
                USER_ACTION_REQUIRED: true,
                LOG_LEVEL: 'warn',
            },
            SYSTEM: {
                RETRYABLE: true,
                USER_ACTION_REQUIRED: false,
                LOG_LEVEL: 'error',
            },
            AUTHENTICATION: {
                RETRYABLE: false,
                USER_ACTION_REQUIRED: true,
                LOG_LEVEL: 'warn',
            },
            NETWORK: {
                RETRYABLE: true,
                USER_ACTION_REQUIRED: false,
                LOG_LEVEL: 'error',
            },
        },
    },
};
// Helper functions for accessing configuration
const getGameInfo = (gameId) => {
    const game = exports.AppConfig.GAMES[gameId];
    if (!game) {
        throw new Error(`Unknown game ID: ${gameId}`);
    }
    return game;
};
exports.getGameInfo = getGameInfo;
const getAllGames = () => {
    return Object.values(exports.AppConfig.GAMES);
};
exports.getAllGames = getAllGames;
const getApiUrl = (type = 'http') => {
    if (typeof window === 'undefined') {
        // Server-side: use default URLs
        return type === 'http' ? exports.AppConfig.API.DEFAULT_HTTP_URL : exports.AppConfig.API.DEFAULT_WS_URL;
    }
    // Client-side: use environment variables with fallbacks
    const envVar = type === 'http' ? 'NEXT_PUBLIC_API_HTTP' : 'NEXT_PUBLIC_API_WS';
    const defaultUrl = type === 'http' ? exports.AppConfig.API.DEFAULT_HTTP_URL : exports.AppConfig.API.DEFAULT_WS_URL;
    return process.env[envVar] ?? defaultUrl;
};
exports.getApiUrl = getApiUrl;
// Error handling utilities
const createErrorResponse = (code, message, category, statusCode, details, context, requestId) => ({
    success: false,
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
exports.createErrorResponse = createErrorResponse;
const createSuccessResponse = (data, requestId) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
});
exports.createSuccessResponse = createSuccessResponse;
// Error recovery utilities
const shouldRetry = (category) => {
    return exports.AppConfig.ERROR_HANDLING.CATEGORIES[category].RETRYABLE;
};
exports.shouldRetry = shouldRetry;
const getUserActionRequired = (category) => {
    return exports.AppConfig.ERROR_HANDLING.CATEGORIES[category].USER_ACTION_REQUIRED;
};
exports.getUserActionRequired = getUserActionRequired;
const getLogLevel = (category) => {
    return exports.AppConfig.ERROR_HANDLING.CATEGORIES[category].LOG_LEVEL;
};
exports.getLogLevel = getLogLevel;
// Export everything for convenience
__exportStar(require("@party/types"), exports);
