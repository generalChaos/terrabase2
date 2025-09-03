import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: 'Magic Marker 🎨 - AI Image Analysis',
  description: 'AI-powered image analysis and generation tool with advanced computer vision capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
