// Environment-based configuration for Terrabase2 Portal
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

export const config = {
  // Base URLs for different environments
  urls: {
    // Frontend applications
    partyGame: isDevelopment
      ? 'http://localhost:3003'  // Party Game web app dev port
      : 'https://party-game.terrabase2.com',  // Party Game web app (when deployed)

    magicMarker: isDevelopment
      ? 'http://localhost:3002'  // Magic Marker web app dev port
      : 'https://terrabase2-magic-marker.vercel.app',  // Magic Marker web app (deployed)

    portal: isDevelopment
      ? 'http://localhost:3000'  // Portal dev port
      : isVercel
        ? 'https://portal-clean-dun.vercel.app'  // Vercel deployment
        : 'https://terrabase2.com',  // Future AWS deployment
  },

  // API endpoints (for backend functionality)
  api: {
    partyGame: isDevelopment
      ? 'http://localhost:3004'  // Party Game API dev port
      : 'https://party-game-api.railway.app',  // Party Game API (when deployed)

    magicMarker: isDevelopment
      ? 'http://localhost:3001'  // Magic Marker API dev port
      : 'https://magic-marker-api.railway.app',  // Magic Marker API (when deployed)
  },
  
  // GitHub repository URLs
  github: {
    partyGame: 'https://github.com/yourusername/terrabase2/tree/main/apps/party-game',
    magicMarker: 'https://github.com/yourusername/terrabase2/tree/main/apps/magic-marker',
    portal: 'https://github.com/yourusername/terrabase2/tree/main/apps/portal',
  },
  
  // Environment info
  environment: {
    isDevelopment,
    isProduction: !isDevelopment,
    isVercel,
  }
};

export default config;
