// Author: Dr Hamid MADANI <drmdh@msn.com>
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NextAuthSessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Mosta ParkManager — Showcase @mostajs/*',
  description: 'Gestion d\'un parc de loisirs et d\'attractions — exemple end-to-end de l\'écosystème @mostajs/* (Next.js + Electron + ORM multi-dialecte).',
  authors: [{ name: 'Dr Hamid MADANI', url: 'mailto:drmdh@msn.com' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0EA5E9',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextAuthSessionProvider>
          <QueryProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
            <Toaster position="top-right" />
          </QueryProvider>
        </NextAuthSessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {})
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
