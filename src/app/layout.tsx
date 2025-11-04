import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Postman Clone',
  description: 'A Postman-like API testing tool built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground overflow-x-hidden transition-colors`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


