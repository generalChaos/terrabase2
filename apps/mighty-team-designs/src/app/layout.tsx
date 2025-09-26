import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mighty Team Designs - Generate Professional Team Logos',
  description: 'Create professional team logos in minutes with our AI-powered design tool. Perfect for youth leagues, recreational teams, and seasonal sports.',
  keywords: ['team logos', 'sports logos', 'youth leagues', 'recreational teams', 'AI logo generator'],
  authors: [{ name: 'Mighty Team Designs' }],
}

export const viewport = 'width=device-width, initial-scale=1'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
