"use client";
import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";

export function RoomCodeChip({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/join/${code}` 
    : `/join/${code}`;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm px-3 py-2 rounded-full bg-[--panel] border border-slate-800">{code}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(url); notify.success("Copied room link"); }}
        className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-slate-800/70 hover:bg-slate-800 border border-slate-700"
      >
        <Copy size={16} /> Copy
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-slate-800/70 hover:bg-slate-800 border border-slate-700">
            <QrCode size={16} /> QR
          </button>
        </DialogTrigger>
        <DialogContent className="bg-[--panel] border border-slate-800">
          <DialogHeader><DialogTitle>Scan to Join</DialogTitle></DialogHeader>
          <div className="grid place-items-center py-6">
            <QRCode value={url} bgColor="transparent" fgColor="#E5E7EB" size={180} />
            <div className="mt-3 text-sm opacity-80">{url}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
