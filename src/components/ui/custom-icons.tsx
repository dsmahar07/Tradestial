import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

export const NetPnlIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="cashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1FC16B" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="cashGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Stack of bills - back */}
    <rect
      x="4"
      y="10"
      width="16"
      height="10"
      rx="2"
      fill="url(#cashGrad)"
      fillOpacity="0.2"
      stroke="url(#cashGrad)"
      strokeWidth="1"
    />
    
    {/* Stack of bills - middle */}
    <rect
      x="3"
      y="8"
      width="16"
      height="10"
      rx="2"
      fill="url(#cashGrad)"
      fillOpacity="0.3"
      stroke="url(#cashGrad)"
      strokeWidth="1"
    />
    
    {/* Main bill - front */}
    <rect
      x="2"
      y="6"
      width="16"
      height="10"
      rx="2"
      fill="url(#cashGrad)"
      fillOpacity="0.15"
      stroke="url(#cashGrad)"
      strokeWidth="2"
    />
    
    {/* Glass effect on main bill */}
    <rect
      x="2"
      y="6"
      width="16"
      height="5"
      rx="2"
      fill="url(#cashGlass)"
    />
    
    {/* Simple dollar sign */}
    <text
      x="10"
      y="13"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="url(#cashGrad)"
      fontSize="8"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      $
    </text>
    
    {/* Corner circles */}
    <circle cx="5" cy="9" r="1" fill="url(#cashGrad)" fillOpacity="0.4" />
    <circle cx="15" cy="9" r="1" fill="url(#cashGrad)" fillOpacity="0.4" />
    <circle cx="5" cy="13" r="1" fill="url(#cashGrad)" fillOpacity="0.4" />
    <circle cx="15" cy="13" r="1" fill="url(#cashGrad)" fillOpacity="0.4" />
    
    {/* Trend arrow */}
    <path
      d="M18 4L20 2L22 4"
      stroke="url(#cashGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 2V6"
      stroke="url(#cashGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const OrdersIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="ordersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="ordersGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>
    </defs>
    {/* Shopping bag */}
    <path
      d="M6 7V6C6 4.34315 7.34315 3 9 3H15C16.6569 3 18 4.34315 18 6V7"
      stroke="url(#ordersGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="4"
      y="7"
      width="16"
      height="12"
      rx="2"
      fill="url(#ordersGrad)"
      fillOpacity="0.15"
      stroke="url(#ordersGrad)"
      strokeWidth="2"
    />
    {/* Glass effect overlay */}
    <rect
      x="4"
      y="7"
      width="16"
      height="6"
      rx="2"
      fill="url(#ordersGlass)"
    />
    {/* Checkmark */}
    <path
      d="M9 13L11 15L15 11"
      stroke="url(#ordersGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const VisitorsIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="visitorsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="visitorsGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>
    </defs>
    {/* Eye shape */}
    <path
      d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
      fill="url(#visitorsGrad)"
      fillOpacity="0.15"
      stroke="url(#visitorsGrad)"
      strokeWidth="2"
    />
    {/* Glass effect overlay on top half */}
    <path
      d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C20 10 16 8 12 8C8 8 4 10 2 12Z"
      fill="url(#visitorsGlass)"
    />
    {/* Eye center */}
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="url(#visitorsGrad)"
      fillOpacity="0.3"
      stroke="url(#visitorsGrad)"
      strokeWidth="2"
    />
    {/* Glass highlight on iris */}
    <ellipse
      cx="12"
      cy="10.5"
      rx="2"
      ry="1"
      fill="url(#visitorsGlass)"
    />
    {/* Pupil */}
    <circle
      cx="12"
      cy="12"
      r="1"
      fill="url(#visitorsGrad)"
    />
  </svg>
)

export const RefundIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="refundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="refundGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>
    </defs>
    {/* Return box */}
    <rect
      x="4"
      y="8"
      width="16"
      height="10"
      rx="2"
      fill="url(#refundGrad)"
      fillOpacity="0.15"
      stroke="url(#refundGrad)"
      strokeWidth="2"
    />
    {/* Glass effect overlay */}
    <rect
      x="4"
      y="8"
      width="16"
      height="5"
      rx="2"
      fill="url(#refundGlass)"
    />
    {/* Return arrow */}
    <path
      d="M8 13H16M8 13L11 10M8 13L11 16"
      stroke="url(#refundGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Package top */}
    <path
      d="M8 8L12 5L16 8"
      stroke="url(#refundGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Glass highlight on package top */}
    <path
      d="M9 7.5L12 5.5L15 7.5"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const BudgetIncomeIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="incomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="incomeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Upward arrow background */}
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#incomeGrad)"
      fillOpacity="0.1"
      stroke="url(#incomeGrad)"
      strokeWidth="1.5"
    />
    
    {/* Glass effect */}
    <circle
      cx="12"
      cy="8"
      r="6"
      fill="url(#incomeGlass)"
    />
    
    {/* Upward trending arrow */}
    <path
      d="M8 16L12 8L16 12"
      stroke="url(#incomeGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Arrow head */}
    <path
      d="M10 8L12 6L14 8"
      stroke="url(#incomeGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Dollar sign */}
    <circle
      cx="18"
      cy="6"
      r="3"
      fill="url(#incomeGrad)"
      fillOpacity="0.2"
    />
    <text
      x="18"
      y="7"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="url(#incomeGrad)"
      fontSize="6"
      fontWeight="bold"
    >
      $
    </text>
  </svg>
)

export const BudgetExpensesIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="expensesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
      <linearGradient id="expensesGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Credit card */}
    <rect
      x="3"
      y="7"
      width="18"
      height="12"
      rx="3"
      fill="url(#expensesGrad)"
      fillOpacity="0.15"
      stroke="url(#expensesGrad)"
      strokeWidth="2"
    />
    
    {/* Glass effect */}
    <rect
      x="3"
      y="7"
      width="18"
      height="6"
      rx="3"
      fill="url(#expensesGlass)"
    />
    
    {/* Magnetic stripe */}
    <rect
      x="3"
      y="10"
      width="18"
      height="2"
      fill="url(#expensesGrad)"
      fillOpacity="0.4"
    />
    
    {/* Card details */}
    <rect x="6" y="14" width="4" height="1" rx="0.5" fill="url(#expensesGrad)" fillOpacity="0.6" />
    <rect x="6" y="16" width="6" height="1" rx="0.5" fill="url(#expensesGrad)" fillOpacity="0.6" />
    
    {/* Downward arrow */}
    <path
      d="M16 3L18 5L20 3"
      stroke="url(#expensesGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 1V5"
      stroke="url(#expensesGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const BudgetScheduledIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="scheduledGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="scheduledGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Calendar background */}
    <rect
      x="4"
      y="5"
      width="16"
      height="16"
      rx="3"
      fill="url(#scheduledGrad)"
      fillOpacity="0.15"
      stroke="url(#scheduledGrad)"
      strokeWidth="2"
    />
    
    {/* Glass effect */}
    <rect
      x="4"
      y="5"
      width="16"
      height="8"
      rx="3"
      fill="url(#scheduledGlass)"
    />
    
    {/* Calendar header */}
    <rect
      x="4"
      y="5"
      width="16"
      height="4"
      rx="3"
      fill="url(#scheduledGrad)"
      fillOpacity="0.3"
    />
    
    {/* Calendar rings */}
    <rect x="8" y="2" width="1.5" height="4" rx="0.75" fill="url(#scheduledGrad)" />
    <rect x="14.5" y="2" width="1.5" height="4" rx="0.75" fill="url(#scheduledGrad)" />
    
    {/* Calendar grid */}
    <circle cx="8" cy="12" r="1" fill="url(#scheduledGrad)" fillOpacity="0.4" />
    <circle cx="12" cy="12" r="1" fill="url(#scheduledGrad)" fillOpacity="0.4" />
    <circle cx="16" cy="12" r="1" fill="url(#scheduledGrad)" fillOpacity="0.4" />
    <circle cx="8" cy="16" r="1" fill="url(#scheduledGrad)" fillOpacity="0.4" />
    <circle cx="12" cy="16" r="1" fill="url(#scheduledGrad)" />
    <circle cx="16" cy="16" r="1" fill="url(#scheduledGrad)" fillOpacity="0.4" />
    
    {/* Clock indicator */}
    <circle
      cx="18"
      cy="7"
      r="2.5"
      fill="url(#scheduledGrad)"
      fillOpacity="0.2"
      stroke="url(#scheduledGrad)"
      strokeWidth="1"
    />
    <path
      d="M18 6V7L18.5 7.5"
      stroke="url(#scheduledGrad)"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
)

export const PNLOverviewIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="budgetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id="budgetGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Clipboard/Document background */}
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      fill="url(#budgetGrad)"
      fillOpacity="0.1"
      stroke="url(#budgetGrad)"
      strokeWidth="2"
    />
    
    {/* Glass effect */}
    <rect
      x="4"
      y="2"
      width="16"
      height="10"
      rx="2"
      fill="url(#budgetGlass)"
    />
    
    {/* Clipboard clip */}
    <rect
      x="9"
      y="1"
      width="6"
      height="3"
      rx="1.5"
      fill="url(#budgetGrad)"
      fillOpacity="0.3"
      stroke="url(#budgetGrad)"
      strokeWidth="1"
    />
    
    {/* Dollar sign - main focus */}
    <circle
      cx="12"
      cy="8"
      r="3"
      fill="url(#budgetGrad)"
      fillOpacity="0.2"
      stroke="url(#budgetGrad)"
      strokeWidth="2"
    />
    <text
      x="12"
      y="9"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="url(#budgetGrad)"
      fontSize="8"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      $
    </text>
    
    {/* Budget lines/items */}
    <rect x="7" y="13" width="6" height="1" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.6" />
    <rect x="7" y="15" width="8" height="1" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.4" />
    <rect x="7" y="17" width="5" height="1" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.5" />
    <rect x="7" y="19" width="7" height="1" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.3" />
    
    {/* Small chart indicator */}
    <rect x="16" y="15" width="1" height="3" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.6" />
    <rect x="17.5" y="13" width="1" height="5" rx="0.5" fill="url(#budgetGrad)" fillOpacity="0.8" />
    
    {/* Checkmark for completed budget */}
    <path
      d="M6 18L7 19L9 17"
      stroke="url(#budgetGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const StreakIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="streakGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Lightning bolt shape for winning streak */}
    <path
      d="M13 2L4 12H10L8 22L19 10H13L13 2Z"
      fill="url(#streakGrad)"
      fillOpacity="0.15"
      stroke="url(#streakGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    
    {/* Inner lightning detail */}
    <path
      d="M13 2L6 10H10L8 18L17 8H13L13 2Z"
      fill="url(#streakGrad)"
      fillOpacity="0.3"
    />
    
    {/* Glass effect overlay */}
    <path
      d="M13 2L8 8H10L9 12L14 6H13L13 2Z"
      fill="url(#streakGlass)"
    />
    
    {/* Winning trend arrows around lightning */}
    <path
      d="M3 6L5 4L7 6"
      stroke="url(#streakGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.6"
    />
    <path
      d="M5 4V7"
      stroke="url(#streakGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
    
    <path
      d="M17 4L19 2L21 4"
      stroke="url(#streakGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.6"
    />
    <path
      d="M19 2V5"
      stroke="url(#streakGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
    
    {/* Energy particles/sparkles */}
    <circle cx="2" cy="14" r="0.8" fill="url(#streakGrad)" fillOpacity="0.7" />
    <circle cx="22" cy="12" r="0.6" fill="url(#streakGrad)" fillOpacity="0.5" />
    <circle cx="20" cy="18" r="0.4" fill="url(#streakGrad)" fillOpacity="0.6" />
  </svg>
)

export const ExpectancyIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="expectancyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="expectancyGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
    </defs>
    
    {/* Target/Bullseye background */}
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#expectancyGrad)"
      fillOpacity="0.1"
      stroke="url(#expectancyGrad)"
      strokeWidth="2"
    />
    
    {/* Middle ring */}
    <circle
      cx="12"
      cy="12"
      r="7"
      fill="none"
      stroke="url(#expectancyGrad)"
      strokeWidth="1.5"
      strokeOpacity="0.4"
    />
    
    {/* Inner ring */}
    <circle
      cx="12"
      cy="12"
      r="4"
      fill="url(#expectancyGrad)"
      fillOpacity="0.2"
      stroke="url(#expectancyGrad)"
      strokeWidth="2"
    />
    
    {/* Center bullseye */}
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="url(#expectancyGrad)"
      fillOpacity="0.4"
    />
    
    {/* Glass effect on top half */}
    <circle
      cx="12"
      cy="8"
      r="6"
      fill="url(#expectancyGlass)"
    />
    
    {/* Arrow hitting target */}
    <path
      d="M4 12L8 12"
      stroke="url(#expectancyGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 12L6 10L6 14Z"
      fill="url(#expectancyGrad)"
      stroke="url(#expectancyGrad)"
      strokeWidth="1"
    />
    
    {/* Mathematical symbol for expectancy */}
    <text
      x="12"
      y="12"
      textAnchor="middle"
      dominantBaseline="middle"
      fill="url(#expectancyGrad)"
      fontSize="6"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      E
    </text>
    
    {/* Small trend indicator */}
    <path
      d="M16 8L18 6L20 8"
      stroke="url(#expectancyGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.6"
    />
    <path
      d="M18 6V9"
      stroke="url(#expectancyGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
  </svg>
)