'use client';
import { RevealResults } from '../components/reveal-results';

type RevealPhaseViewProps = {
  options: Array<{
    id: string;
    text: string;
    color: string;
    playerId?: string;
    playerAvatar?: string;
  }>;
  correctAnswer?: string;
  votes: Array<{ voter: string; choiceId: string }>;
  players: Array<{ id: string; name: string; avatar?: string; score: number }>;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function RevealPhaseView({ 
  options, 
  correctAnswer, 
  votes, 
  players, 
  selectedChoiceId, 
  showOptions 
}: RevealPhaseViewProps) {
  return (
    <RevealResults
      options={options}
      correctAnswer={correctAnswer}
      votes={votes}
      players={players}
      selectedChoiceId={selectedChoiceId}
      showOptions={showOptions}
      state="reveal"
    />
  );
}
