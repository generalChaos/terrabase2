import "./globals.css";
import { Inter, Bangers } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers" });

export const metadata = { title: "Fibbing It!", description: "Party game" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bangers.variable} bg-[--bg] text-[--text] antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* Subtle gradient bg */}
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,.22),transparent_55%)]" />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
