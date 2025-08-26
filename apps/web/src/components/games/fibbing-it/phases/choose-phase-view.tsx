'use client';
import { VotingOptions } from '../components/voting-options';

type ChoosePhaseViewProps = {
  options: Array<{
    id: string;
    text: string;
    color: string;
    playerId?: string;
    playerAvatar?: string;
  }>;
  onSubmitVote: (choiceId: string) => void;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function ChoosePhaseView({ options, onSubmitVote, selectedChoiceId, showOptions }: ChoosePhaseViewProps) {
  return (
    <VotingOptions
      options={options}
      onSubmitVote={onSubmitVote}
      selectedChoiceId={selectedChoiceId}
      showOptions={showOptions}
    />
  );
}
