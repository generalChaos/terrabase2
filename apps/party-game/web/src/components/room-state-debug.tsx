'use client';
import { useState } from 'react';
import type { RoomState } from '../shared/types';

type RoomStateDebugProps = {
  roomState: RoomState | null;
  hasSubmittedAnswer?: boolean;
  hasVoted?: boolean;
};

export function RoomStateDebug({
  roomState,
  hasSubmittedAnswer,
  hasVoted,
}: RoomStateDebugProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!roomState) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-[--panel] border border-[--border] rounded-lg overflow-hidden shadow-lg">
      {/* Header with toggle button */}
      <div
        className="flex items-center justify-between p-3 bg-[--accent] text-black cursor-pointer hover:bg-[--accent-hover] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="font-bold text-sm">🐛 Debug Panel</div>
        <div className="text-lg transition-transform duration-200">
          {isCollapsed ? '▼' : '▲'}
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}
      >
        <div className="p-4 text-xs font-mono space-y-1">
          <div>
            <span className="text-[--muted]">Phase:</span> {roomState.phase}
          </div>
          <div>
            <span className="text-[--muted]">Round:</span> {roomState.round}/
            {roomState.maxRounds}
          </div>
          <div>
            <span className="text-[--muted]">Time Left:</span>{' '}
            {roomState.timeLeft}s
          </div>
          <div>
            <span className="text-[--muted]">Players:</span>{' '}
            {roomState.players.length}
          </div>
          <div>
            <span className="text-[--muted]">Current:</span>{' '}
            {roomState.current ? 'Yes' : 'No'}
          </div>
          {roomState.current && (
            <>
              <div>
                <span className="text-[--muted]">Question:</span>{' '}
                {roomState.current.prompt}
              </div>
              <div>
                <span className="text-[--muted]">Bluffs:</span>{' '}
                {roomState.current.bluffs.length}
              </div>
              <div>
                <span className="text-[--muted]">Votes:</span>{' '}
                {roomState.current.votes.length}
              </div>
            </>
          )}
          {hasSubmittedAnswer !== undefined && (
            <div
              className={`mt-2 pt-2 border-t border-[--border] ${hasSubmittedAnswer ? 'text-[--success]' : 'text-[--muted]'}`}
            >
              <span className="text-[--muted]">Answer:</span>{' '}
              {hasSubmittedAnswer ? '✅ Submitted' : '❌ Not Submitted'}
            </div>
          )}
          {hasVoted !== undefined && (
            <div
              className={`${hasVoted ? 'text-[--success]' : 'text-[--muted]'}`}
            >
              <span className="text-[--muted]">Vote:</span>{' '}
              {hasVoted ? '✅ Submitted' : '❌ Not Submitted'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
