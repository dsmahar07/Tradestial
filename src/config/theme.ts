/**
 * Centralized theme configuration for the application
 * Replaces hardcoded color values throughout the codebase
 */

export interface ThemeColors {
  // Brand colors
  primary: string
  primaryHover: string
  
  // Background colors
  background: {
    light: string
    dark: string
  }
  
  // Surface colors (cards, panels)
  surface: {
    light: string
    dark: string
  }
  
  // Chart colors
  charts: {
    success: string
    danger: string
    warning: string
    info: string
    purple: string
    pink: string
    indigo: string
  }
  
  // Status colors
  status: {
    win: string
    loss: string
    neutral: string
  }
}

export const themeColors: ThemeColors = {
  // Brand colors
  primary: '#3b82f6',      // Blue - used for buttons, links, accents
  primaryHover: '#2563eb', // Darker blue for hover states
  
  // Background colors
  background: {
    light: '#f9fafb',      // Light gray background
    dark: '#1C1C1C'        // Dark background
  },
  
  // Surface colors (cards, panels, modals)
  surface: {
    light: '#ffffff',      // White surface
    dark: '#171717'        // Dark surface
  },
  
  // Chart colors palette
  charts: {
    success: '#10b981',    // Green
    danger: '#ef4444',     // Red
    warning: '#eab308',    // Yellow  
    info: '#3b82f6',       // Blue
    purple: '#8b5cf6',     // Purple
    pink: '#ec4899',       // Pink
    indigo: '#6366f1'      // Indigo
  },
  
  // Trading status colors
  status: {
    win: '#10b981',        // Green for wins
    loss: '#ef4444',       // Red for losses
    neutral: '#6b7280'     // Gray for neutral/draws
  }
}

/**
 * Chart color palette for data visualization
 * Provides consistent colors for charts and graphs
 */
export const chartColorPalette = [
  themeColors.charts.danger,   // #ef4444 - Red
  themeColors.charts.warning,  // #eab308 - Orange/Yellow
  themeColors.charts.success,  // #10b981 - Green
  themeColors.charts.info,     // #3b82f6 - Blue
  themeColors.charts.purple,   // #8b5cf6 - Purple
  themeColors.charts.pink,     // #ec4899 - Pink
  themeColors.charts.indigo    // #6366f1 - Indigo
]

/**
 * CSS custom properties for theme colors
 * Can be used in CSS-in-JS or CSS variables
 */
export const themeCssVars = {
  '--color-primary': themeColors.primary,
  '--color-primary-hover': themeColors.primaryHover,
  '--color-bg-light': themeColors.background.light,
  '--color-bg-dark': themeColors.background.dark,
  '--color-surface-light': themeColors.surface.light,
  '--color-surface-dark': themeColors.surface.dark,
  '--color-success': themeColors.charts.success,
  '--color-danger': themeColors.charts.danger,
  '--color-warning': themeColors.charts.warning,
  '--color-info': themeColors.charts.info
} as const

/**
 * Helper function to get theme-aware background classes
 */
export const getBackgroundClasses = () => ({
  page: 'bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)]',
  surface: 'bg-white dark:bg-[var(--color-surface-dark,#171717)]'
})

/**
 * Helper function to get consistent color schemes for components
 */
export const getColorScheme = (color: keyof ThemeColors['charts'] = 'info') => ({
  backgroundColor: themeColors.charts[color],
  color: '#ffffff'
})