export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1C1C1C] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}