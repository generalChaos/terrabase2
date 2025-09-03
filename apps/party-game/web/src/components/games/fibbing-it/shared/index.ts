// Shared types
export type { Option, Vote, Player, ComponentState } from './types';

// Shared utilities - only the most valuable ones
export { 
  DEFAULT_COLORS, 
  getBorderColor, 
  getVoteCount
} from './utils';

// Shared styling system
export { gameStyles, animationDelays, combineStyles } from './styles';

// Shared layouts
export { PhaseLayout } from '../layouts/phase-layout';
export { TimerPhaseLayout } from '../layouts/timer-phase-layout';

// Shared phase components
export { FibbingItPromptView } from '../phases/fibbing-it-prompt-view';
export { FibbingItVotingView } from '../phases/fibbing-it-voting-view';
export { FibbingItScoringView } from '../phases/fibbing-it-scoring-view';
export { FibbingItRevealView } from '../phases/fibbing-it-reveal-view';
export { FibbingItGameOverView } from '../phases/fibbing-it-game-over-view';
