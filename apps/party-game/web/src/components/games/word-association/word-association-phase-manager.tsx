'use client';
import {
  BaseGamePhaseManager,
  BaseGamePhaseManagerProps,
  LobbyView,
} from '../shared';

type WordAssociationPhaseManagerProps = BaseGamePhaseManagerProps & {
  roomCode?: string;
  word?: string;
  associations?: Array<{ id: string; text: string; playerId: string }>;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  onSubmitAssociation?: (association: string) => void;
  hasSubmitted?: boolean;
};

export class WordAssociationPhaseManager extends BaseGamePhaseManager {
  readonly gameType = 'word-association';

  renderPhase(props: WordAssociationPhaseManagerProps): React.ReactNode {
    const {
      phase,
      isHost,
      roomCode,
      word,
      associations = [],
      timeLeft = 0,
      round = 1,
      maxRounds = 5,
      players = [],
      hasSubmitted = false,
      onSubmitAssociation,
    } = props;

    if (!this.isValidPhase(phase)) {
      console.warn(`Invalid phase for word-association: ${phase}`);
      return null;
    }

    switch (phase) {
      case 'lobby':
        return (
          <LobbyView
            roomCode={roomCode || 'XXXX'}
            players={players}
            isHost={isHost}
            onStartGame={props.onStartGame}
          />
        );

      case 'prompt':
        if (isHost) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h2 className="text-2xl font-bold mb-4">
                Round {round} of {maxRounds}
              </h2>
              <div className="text-4xl font-bold mb-8">
                {word || 'Loading word...'}
              </div>
              <div className="text-lg text-[--muted] mb-4">
                Players are thinking of associations...
              </div>
              <div className="text-sm text-[--muted]">
                Time left: {timeLeft}s
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h2 className="text-2xl font-bold mb-4">
                Round {round} of {maxRounds}
              </h2>
              <div className="text-4xl font-bold mb-8">
                {word || 'Loading word...'}
              </div>
              <div className="text-lg mb-6">
                What word comes to mind when you think of &quot;{word}&quot;?
              </div>
              {!hasSubmitted ? (
                <div className="w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Enter your association..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        onSubmitAssociation?.(e.currentTarget.value.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input');
                      if (input?.value.trim()) {
                        onSubmitAssociation?.(input.value.trim());
                      }
                    }}
                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Submit Association
                  </button>
                </div>
              ) : (
                <div className="text-green-600 font-semibold">
                  ✓ Association submitted!
                </div>
              )}
              <div className="text-sm text-[--muted] mt-4">
                Time left: {timeLeft}s
              </div>
            </div>
          );
        }

      case 'choose':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-2xl font-bold mb-4">
              Round {round} of {maxRounds}
            </h2>
            <div className="text-4xl font-bold mb-8">{word}</div>
            <div className="text-lg mb-6">
              Vote for the most creative association!
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {associations.map(association => (
                <div
                  key={association.id}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="text-lg font-medium">{association.text}</div>
                  <div className="text-sm text-gray-500">
                    Submitted by a player
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-[--muted] mt-4">
              Time left: {timeLeft}s
            </div>
          </div>
        );

      case 'scoring':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-2xl font-bold mb-4">
              Round {round} of {maxRounds}
            </h2>
            <div className="text-4xl font-bold mb-8">{word}</div>
            <div className="text-lg mb-6">Round complete!</div>
            <div className="text-sm text-[--muted]">Time left: {timeLeft}s</div>
          </div>
        );

      case 'game-over':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-3xl font-bold mb-8">Game Over!</h1>
            <div className="text-[--muted]">Final scores coming soon...</div>
          </div>
        );

      default:
        return null;
    }
  }
}

// Export a function component for easier use
export function WordAssociationPhaseManagerFC(
  props: WordAssociationPhaseManagerProps
) {
  const manager = new WordAssociationPhaseManager();
  return manager.renderPhase(props);
}
