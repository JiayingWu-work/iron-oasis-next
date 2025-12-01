import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iron Oasis Dashboard',
  description: 'Class & payment tracking for Iron Oasis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
