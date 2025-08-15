import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/hooks/use-theme'
import { PerformanceMonitor } from '@/components/features/performance-monitor'

export const metadata: Metadata = {
  title: {
    template: '%s | Tradtrace',
    default: 'Tradtrace - Trading Analytics Platform',
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
        {/* Favicon - Using original Tradtrace logo with slight radius */}
        <link rel="icon" href="/favicon.ico?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-slight-radius.png?v=4" />
        <link rel="apple-touch-icon" sizes="180x180" href="/tradtrace-logo.png?v=4" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#6b21a8" />
        <meta name="theme-color" content="#6b21a8" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('tradtrace-ui-theme');
                  
                  // Clear any existing theme classes first
                  document.documentElement.classList.remove('light', 'dark');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    // Default to light (including when theme is null/undefined)
                    document.documentElement.classList.add('light');
                    if (!theme) {
                      localStorage.setItem('tradtrace-ui-theme', 'light');
                    }
                  }
                } catch (e) {
                  // Fallback to light theme
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('light');
                  localStorage.setItem('tradtrace-ui-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="light"
          storageKey="tradtrace-ui-theme"
        >
          <PerformanceMonitor />
          <div className="min-h-screen w-full">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}