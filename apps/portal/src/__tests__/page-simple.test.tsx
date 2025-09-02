import { render, screen } from '@testing-library/react';
import Home from '../app/page';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the config module completely
jest.mock('../lib/config', () => ({
  __esModule: true,
  default: {
    urls: {
      partyGame: 'http://localhost:3001',
      magicMarker: 'http://localhost:3002',
      portal: 'http://localhost:3000',
    },
    github: {
      partyGame: 'https://github.com/test/terrabase2/tree/main/apps/party-game',
      magicMarker: 'https://github.com/test/terrabase2/tree/main/apps/magic-marker',
      portal: 'https://github.com/test/terrabase2/tree/main/apps/portal',
    },
    environment: {
      isDevelopment: true,
      isProduction: false,
      isVercel: false,
    },
  },
}));

describe('Homepage Component - Simple Tests', () => {
  test('should render without crashing', () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  test('should render the main logo', () => {
    render(<Home />);
    
    const logo = screen.getByAltText('Terrabase2 Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/terrabase2_logo_transparent.png');
  });

  test('should render the main description', () => {
    render(<Home />);
    
    expect(screen.getByText(/A collection of innovative applications/)).toBeInTheDocument();
    expect(screen.getByText(/showcasing modern web development/)).toBeInTheDocument();
  });

  test('should render both project cards', () => {
    render(<Home />);
    
    // Party Game card
    expect(screen.getByText('Party Game')).toBeInTheDocument();
    expect(screen.getByText(/Real-time multiplayer party game/)).toBeInTheDocument();
    
    // Magic Marker card
    expect(screen.getByText('Magic Marker')).toBeInTheDocument();
    expect(screen.getByText(/AI-powered image analysis/)).toBeInTheDocument();
  });

  test('should render technology tags', () => {
    render(<Home />);
    
    // Party Game technologies
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    
    // Magic Marker technologies
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Express')).toBeInTheDocument();
    expect(screen.getByText('AI/ML')).toBeInTheDocument();
    expect(screen.getByText('Vite')).toBeInTheDocument();
  });

  test('should render footer text', () => {
    render(<Home />);
    
    expect(screen.getByText(/Built with modern web technologies/)).toBeInTheDocument();
    expect(screen.getByText(/deployed on the cloud/)).toBeInTheDocument();
  });
});
