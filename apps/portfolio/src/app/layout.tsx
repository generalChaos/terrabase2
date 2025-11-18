import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ricardo Velasco | Engineering Manager and Full-Stack Developer",
  description: "Engineering manager & full-stack builder crafting real-time apps, AI-powered tools, and multiplayer experiments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#000000" />
      <body>{children}</body>
    </html>
  );
}

