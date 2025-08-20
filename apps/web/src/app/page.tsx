"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function createRoom() {
    setLoading(true);
    const base = process.env.NEXT_PUBLIC_API_HTTP ?? "http://localhost:3001";
    const res = await fetch(base + "/rooms", { method: "POST" });
    const data = await res.json();
    if (data.code) router.push(`/host/${data.code}`);
    setLoading(false);
  }

  return (
    <main className="min-h-[80dvh] grid place-items-center">
      <div className="text-center">
        <div className="text-6xl h1">Fibbing It!</div>
        <p className="opacity-80 mt-2">A bluffing party game you play on your phones.</p>
        <button
          onClick={createRoom}
          className="mt-6 h-14 px-10 rounded-2xl bg-primary text-white font-semibold hover:brightness-110 transition"
        >
          {loading ? "Spinning up…" : "Create Room"}
        </button>
      </div>
    </main>
  );
}
