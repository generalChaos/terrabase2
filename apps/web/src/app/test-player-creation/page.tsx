'use client';

import { PlayerCreationForm } from '@/components/player-creation-form';

export default function TestPlayerCreation() {
  const handleSubmit = (data: { nickname: string; avatar: string }) => {
    console.log('Player creation data:', data);
    alert(`Created player: ${data.nickname} with avatar ${data.avatar}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <PlayerCreationForm
        onSubmit={handleSubmit}
        onCancel={() => window.history.back()}
        isHost={true}
        roomCode="TEST123"
      />
    </div>
  );
}
