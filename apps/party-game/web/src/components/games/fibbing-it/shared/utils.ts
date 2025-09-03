import type { Option, Vote, Player } from './types';

// Shared color utilities - used in multiple places
export const DEFAULT_COLORS = [
  'from-orange-500 to-orange-600', // Orange
  'from-pink-500 to-pink-600',     // Magenta/Deep Pink
  'from-teal-500 to-teal-600',     // Teal/Blue-Green
  'from-green-600 to-green-700',   // Dark Green
] as const;

export const getBorderColor = (colorClass: string): string => {
  const colorMap: Record<string, string> = {
    'from-orange-500 to-orange-600': '#ea580c', // orange-600
    'from-pink-500 to-pink-600': '#db2777', // pink-600
    'from-teal-500 to-teal-600': '#0d9488', // teal-600
    'from-green-600 to-green-700': '#059669', // green-600
  };
  return colorMap[colorClass] || '#ffffff';
};

// Simple vote counting - used in multiple places
export const getVoteCount = (choiceId: string, votes: Vote[]): number => {
  return votes.filter(vote => vote.choiceId === choiceId).length;
};
