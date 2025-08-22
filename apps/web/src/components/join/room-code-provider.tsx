'use client';
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useParams } from 'next/navigation';
import { RoomCodeChip } from '@/components/games/shared/ui';

type RoomCodeContextType = {
  roomCode: string;
  setRoomCode: (code: string) => void;
};

const RoomCodeContext = createContext<RoomCodeContextType | undefined>(
  undefined
);

export function useRoomCode() {
  const context = useContext(RoomCodeContext);
  if (!context) {
    throw new Error('useRoomCode must be used within a RoomCodeProvider');
  }
  return context;
}

type RoomCodeProviderProps = {
  children: ReactNode;
};

export function RoomCodeProvider({ children }: RoomCodeProviderProps) {
  const params = useParams();
  const [roomCode, setRoomCode] = useState<string>('');

  useEffect(() => {
    if (params.code) {
      setRoomCode(params.code as string);
    }
  }, [params.code]);

  return (
    <RoomCodeContext.Provider value={{ roomCode, setRoomCode }}>
      <div className="max-w-[1100px] mx-auto px-6 py-6 text-white">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">🎮 Party Games</div>
            <div className="hidden sm:block opacity-70 text-xl">Join Game</div>
          </div>
          <div className="flex items-center gap-4">
            {roomCode && <RoomCodeChip code={roomCode} />}
          </div>
        </header>

        {roomCode && (
          <div className="mt-3 text-sm opacity-80">
            Joining room: <span className="font-mono">{roomCode}</span>
          </div>
        )}

        <main className="mt-6">{children}</main>
      </div>
    </RoomCodeContext.Provider>
  );
}
