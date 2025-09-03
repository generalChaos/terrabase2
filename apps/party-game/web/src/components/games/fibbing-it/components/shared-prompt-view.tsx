'use client';
import { useGamePhase } from '../hooks/use-game-phase';
import { 
  GameLayout, 
  TimerDisplay, 
  QuestionDisplay, 
  RoundInfo, 
  GamePhaseContent 
} from './index';
import type { ComponentState } from '../../../../shared/types';

type SharedPromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  state: ComponentState;
  options?: Array<{
    id: string;
    text: string;
    color: string;
    playerId?: string;
    playerAvatar?: string;
  }>;
  correctAnswer?: string;
  votes?: Array<{ voter: string; vote: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number }>;
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmitted?: boolean;
  selectedChoiceId?: string;
  onPlayAgain?: () => void;
};

export function SharedPromptView(props: SharedPromptViewProps) {
  const { showOptions, phaseProps } = useGamePhase(props);

  return (
    <GameLayout>
      <TimerDisplay timeLeft={props.timeLeft} totalTime={props.totalTime} />
      <QuestionDisplay question={props.question} />
      <GamePhaseContent
        state={props.state}
        {...phaseProps}
        showOptions={showOptions}
      />
      <RoundInfo round={props.round} maxRounds={props.maxRounds} />
    </GameLayout>
  );
}
