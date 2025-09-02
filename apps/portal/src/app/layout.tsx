import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terrabase2 - Portfolio",
  description: "Personal project portfolio showcasing various applications and tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
