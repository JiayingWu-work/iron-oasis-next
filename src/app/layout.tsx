import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata: Metadata = {
  title: 'Iron Oasis',
  description: 'Class & payment tracking dashboard for Iron Oasis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: NeonAuthUIProvider may add className/style to html
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
