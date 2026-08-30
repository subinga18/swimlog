import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SwimCard · 가민 수영 감성 카드',
  description:
    '가민 커넥트에서 공유한 수영 인터벌 기록을 파싱해 영법별 거리·페이스·심박수를 담은 인스타그램 감성 카드로 만들어 보세요.',
  generator: 'v0.app',
  applicationName: 'SwimCard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SwimCard',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.className} bg-background text-foreground font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
