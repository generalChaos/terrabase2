// Environment-based configuration for Terrabase2 Portal
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

export const config = {
  // Base URLs for different environments
  urls: {
    partyGame: isDevelopment 
      ? 'http://localhost:3001'  // Party Game dev port
      : isVercel 
        ? 'https://party-game.railway.app'  // Railway API deployment
        : 'https://party-game.terrabase2.com',  // Future AWS deployment
    
    magicMarker: isDevelopment 
      ? 'http://localhost:3002'  // Magic Marker dev port
      : isVercel 
        ? 'https://magic-marker.railway.app'  // Railway API deployment
        : 'https://magic-marker.terrabase2.com',  // Future AWS deployment
    
    portal: isDevelopment 
      ? 'http://localhost:3000'  // Portal dev port
      : isVercel 
        ? 'https://terrabase2.vercel.app'  // Vercel deployment
        : 'https://terrabase2.com',  // Future AWS deployment
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
