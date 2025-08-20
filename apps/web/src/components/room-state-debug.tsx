"use client";
import type { RoomState } from "@party/types";

type RoomStateDebugProps = {
  roomState: RoomState | null;
  hasSubmittedAnswer?: boolean;
  hasVoted?: boolean;
};

export function RoomStateDebug({ roomState, hasSubmittedAnswer, hasVoted }: RoomStateDebugProps) {
  if (!roomState) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-[--panel] border border-[--border] rounded-lg p-4 text-xs font-mono overflow-auto max-h-64">
      <div className="font-bold mb-2 text-[--accent]">Room State Debug</div>
      <div className="space-y-1">
        <div><span className="text-[--muted]">Phase:</span> {roomState.phase}</div>
        <div><span className="text-[--muted]">Round:</span> {roomState.round}/{roomState.maxRounds}</div>
        <div><span className="text-[--muted]">Time Left:</span> {roomState.timeLeft}s</div>
        <div><span className="text-[--muted]">Players:</span> {roomState.players.length}</div>
        <div><span className="text-[--muted]">Current:</span> {roomState.current ? 'Yes' : 'No'}</div>
        {roomState.current && (
          <>
            <div><span className="text-[--muted]">Question:</span> {roomState.current.question}</div>
            <div><span className="text-[--muted]">Bluffs:</span> {roomState.current.bluffs.length}</div>
            <div><span className="text-[--muted]">Votes:</span> {roomState.current.votes.length}</div>
          </>
        )}
        {hasSubmittedAnswer !== undefined && (
          <div className={`mt-2 pt-2 border-t border-[--border] ${hasSubmittedAnswer ? 'text-[--success]' : 'text-[--muted]'}`}>
            <span className="text-[--muted]">Answer:</span> {hasSubmittedAnswer ? '✅ Submitted' : '❌ Not Submitted'}
          </div>
        )}
        {hasVoted !== undefined && (
          <div className={`${hasVoted ? 'text-[--success]' : 'text-[--muted]'}`}>
            <span className="text-[--muted]">Vote:</span> {hasVoted ? '✅ Submitted' : '❌ Not Submitted'}
          </div>
        )}
      </div>
    </div>
  );
}
