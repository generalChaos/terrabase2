import type { Metadata } from 'next'
import { Inter, Chakra_Petch } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['600'], variable: '--font-chakra' })

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
    <html lang="en" className={`${inter.variable} ${chakra.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
