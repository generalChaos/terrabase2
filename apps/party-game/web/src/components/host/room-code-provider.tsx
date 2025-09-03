'use client';
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';

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
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-[1100px] mx-auto px-6 py-4 text-white">
          {/* AppShell Header */}
          <AppShell roomCode={roomCode} />
          
          {/* Main Content */}
          <main className="mt-6">
            {children}
          </main>
        </div>
      </div>
    </RoomCodeContext.Provider>
  );
}
