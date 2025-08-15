interface StreakDisplayProps {
  streakDays: number
  streakDaysLabel: string
  streakTrades: number
  streakTradesLabel: string
}

export function StreakDisplay({ 
  streakDays, 
  streakDaysLabel, 
  streakTrades, 
  streakTradesLabel 
}: StreakDisplayProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">DAYS</div>
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <span className="text-green-600 dark:text-green-400 font-bold text-sm">{streakDays}</span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">{streakDaysLabel}</span>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">TRADES</div>
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <span className="text-green-600 dark:text-green-400 font-bold text-sm">{streakTrades}</span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">{streakTradesLabel}</span>
      </div>
    </div>
  )
}