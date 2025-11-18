import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricardo Velasco - Portfolio",
  description: "Engineering manager & full-stack builder crafting real-time apps, AI-powered tools, and multiplayer experiments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

