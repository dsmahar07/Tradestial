import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/hooks/use-theme'
import { PerformanceMonitor } from '@/components/features/performance-monitor'
import { PrivacyProvider } from '@/contexts/privacy-context'
import { Inter } from 'next/font/google'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'
import { ErrorBoundary } from '@/components/providers/error-boundary'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Tradestial',
    default: 'Tradestial - Trading Analytics Platform',
  },
  description: 'A modern trading application built with Next.js',
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: 'white' },
      { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SSR: read theme cookie and apply class to <html>
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const initialThemeClass = themeCookie === 'dark' ? 'dark' : 'light'

  return (
    <html lang="en" className={initialThemeClass} suppressHydrationWarning>
      <head>
        {/* App icons */}
        <link rel="icon" type="image/png" href="/Branding/Tradestial.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Branding/Tradestial.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#6b21a8" />
        <meta name="theme-color" content="#6b21a8" />
      </head>
      <body className={`${inter.variable} font-sans subpixel-antialiased overflow-x-hidden bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="light"
          storageKey="tradestial-ui-theme"
        >
          <PrivacyProvider>
            <Theme appearance="inherit" radius="medium" className="font-sans">
              <ErrorBoundary>
                <PerformanceMonitor />
                <div className="min-h-screen w-full">
                  {children}
                </div>
              </ErrorBoundary>
            </Theme>
          </PrivacyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}