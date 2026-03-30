import { ReactNode } from 'react'

export const metadata = {
  title: 'Next.js App',
  description: 'Next.js on ECS Express Mode',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
