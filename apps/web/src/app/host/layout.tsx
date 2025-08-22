"use client";
import { ReactNode } from "react";
import { RoomCodeProvider } from "@/components/host/room-code-provider";

type HostLayoutProps = {
  children: ReactNode;
};

export default function HostLayout({ children }: HostLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <RoomCodeProvider>
        {children}
      </RoomCodeProvider>
    </div>
  );
}
