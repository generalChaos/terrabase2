"use client";
import { ReactNode } from "react";
import { RoomCodeProvider } from "@/components/join/room-code-provider";

type JoinLayoutProps = {
  children: ReactNode;
};

export default function JoinLayout({ children }: JoinLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <RoomCodeProvider>
        {children}
      </RoomCodeProvider>
    </div>
  );
}
