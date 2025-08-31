import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#171717] px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">The page you’re looking for doesn’t exist.</p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-[#6366f1] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5458e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}



