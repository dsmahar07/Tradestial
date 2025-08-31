import { decodeNoteToken } from '@/lib/note-share'
import { notFound } from 'next/navigation'
import SharedNoteWidget from '@/components/share/SharedNoteWidget'

// Conservative HTML sanitizer for server rendering
function sanitizeHtml(input: string): string {
  let html = String(input || '')
  // Remove dangerous tags entirely
  html = html.replace(/<\/(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
  html = html.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/(script|style|iframe|object|embed|link|meta)>/gi, '')
  // Remove on* event handler attributes
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // Neutralize javascript: and data:text/html URLs in href/src
  html = html.replace(/\s+(href|src)\s*=\s*("|')\s*(javascript:|data:text\/html)/gi, ' $1=$2#')
  html = html.replace(/\s+(href|src)\s*=\s*(javascript:|data:text\/html)/gi, ' $1=#')
  return html
}

// TagChip moved into SharedNoteWidget

export default function ShareNotePage({ params }: { params: { token: string } }) {
  const note = decodeNoteToken(params.token)
  if (!note) return notFound()

  const content = sanitizeHtml(note.content || '')
  const td = note.tradingData

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F5F5] dark:bg-[#1C1C1C] font-inter">
      {/* Header with branding */}
      <header className="bg-transparent dark:bg-transparent px-0 py-4">
        <div className="w-full max-w-none mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10">
          <div className="flex items-center space-x-3">
            <div className="text-xl font-bold">
              <span className="text-blue-600">TRADE</span>
              <span className="text-gray-400">STIAL</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              My Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-10 py-10 flex-1 overflow-hidden">
        <div className="h-full">
          <SharedNoteWidget
          note={{
            title: note.title || 'Untitled',
            contentHtml: content,
            tags: note.tags || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            tradingData: td,
            sharedBy: note.sharedBy?.name
              ? { name: note.sharedBy.name, initials: note.sharedBy.initials }
              : undefined,
          }}
          />
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">View-only share. Editing is disabled.</footer>
      </main>
    </div>
  )
}
