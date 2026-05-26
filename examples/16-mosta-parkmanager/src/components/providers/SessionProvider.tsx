// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { SessionProvider } from 'next-auth/react'

export default function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
