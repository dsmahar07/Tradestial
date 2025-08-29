import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/hooks/use-theme'
import { PerformanceMonitor } from '@/components/features/performance-monitor'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon - Using original Tradestial logo with slight radius */}
        <link rel="icon" href="/favicon.ico?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-slight-radius.png?v=4" />
        <link rel="apple-touch-icon" sizes="180x180" href="/tradtrace-logo.png?v=4" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#6b21a8" />
        <meta name="theme-color" content="#6b21a8" />
        
        <Script id="tradestial-set-theme" strategy="beforeInteractive">{
          `(() => {
            try {
              const theme = localStorage.getItem('tradestial-ui-theme');
              document.documentElement.classList.remove('light', 'dark');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.add('light');
                if (!theme) localStorage.setItem('tradestial-ui-theme', 'light');
              }
            } catch (e) {
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add('light');
              try { localStorage.setItem('tradestial-ui-theme', 'light'); } catch (_) {}
            }
          })();`
        }</Script>
      </head>
      <body className={`${inter.variable} font-sans subpixel-antialiased overflow-x-hidden bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="light"
          storageKey="tradestial-ui-theme"
        >
          <Theme appearance="inherit" radius="medium" className="font-sans">
            <PerformanceMonitor />
            <div className="min-h-screen w-full">
              {children}
            </div>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  )
}