import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'

import { publicAssetUrl } from '@/lib/public-asset-url'
import { AuthProvider } from '@/components/auth-provider'
import { ChunkLoadRecovery } from '@/components/chunk-load-recovery'
import { ShopProvider } from '@/components/shop-provider'
import { ConditionalFooter } from '@/components/conditional-footer'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : 'https://kamilya.example',
  ),
  title: 'Kamilya — мода и коллекции',
  description: 'Минималистичный интернет-магазин одежды: новые коллекции и подборка моделей.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: publicAssetUrl('/logo.png'), type: 'image/png', sizes: 'any' }],
    apple: publicAssetUrl('/logo.png'),
    shortcut: publicAssetUrl('/logo.png'),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      data-base-path={process.env.NEXT_PUBLIC_BASE_PATH ?? ''}
    >
      <body
        className={`font-sans antialiased ${montserrat.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <ChunkLoadRecovery />
        <AuthProvider>
          <ShopProvider>
            {children}
            <ConditionalFooter />
          </ShopProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
