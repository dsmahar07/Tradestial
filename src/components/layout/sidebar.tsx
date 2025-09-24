'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { userProfileService, UserProfile } from '@/services/user-profile.service'
import { authService } from '@/services/auth.service'

import * as Avatar from '@/components/ui/avatar'
import * as Badge from '@/components/ui/badge'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toggle from '@radix-ui/react-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutGrid, Plus, LogOut, Moon, Settings, UserCog, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import * as FancyButton from '@/components/ui/fancy-button'
import { getEnabledNavigationItems } from '@/config/navigation'
import { GradientIcon } from '@/components/ui/gradient-icon'

function CustomVerifiedIconSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 36 36'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M22.3431 5.51481L20.1212 3.29299C18.9497 2.12141 17.0502 2.12141 15.8786 3.29299L13.6568 5.51481H10.5146C8.85778 5.51481 7.51463 6.85796 7.51463 8.51481V11.6569L5.2928 13.8788C4.12123 15.0503 4.12123 16.9498 5.2928 18.1214L7.51463 20.3432V23.4854C7.51463 25.1422 8.85777 26.4854 10.5146 26.4854H13.6568L15.8786 28.7072C17.0502 29.8788 18.9497 29.8788 20.1212 28.7072L22.3431 26.4854H25.4852C27.142 26.4854 28.4852 25.1422 28.4852 23.4854V20.3432L30.707 18.1214C31.8786 16.9498 31.8786 15.0503 30.707 13.8788L28.4852 11.6569V8.51481C28.4852 6.85796 27.142 5.51481 25.4852 5.51481H22.3431ZM21.2217 7.22192C21.4093 7.40946 21.6636 7.51481 21.9288 7.51481H25.4852C26.0375 7.51481 26.4852 7.96253 26.4852 8.51481V12.0712C26.4852 12.3364 26.5905 12.5907 26.7781 12.7783L29.2928 15.293C29.6833 15.6835 29.6833 16.3167 29.2928 16.7072L26.7781 19.2219C26.5905 19.4095 26.4852 19.6638 26.4852 19.929V23.4854C26.4852 24.0377 26.0375 24.4854 25.4852 24.4854H21.9288C21.6636 24.4854 21.4093 24.5907 21.2217 24.7783L18.707 27.293C18.3165 27.6835 17.6833 27.6835 17.2928 27.293L14.7781 24.7783C14.5905 24.5907 14.3362 24.4854 14.071 24.4854H10.5146C9.96234 24.4854 9.51463 24.0377 9.51463 23.4854V19.929C9.51463 19.6638 9.40927 19.4095 9.22174 19.2219L6.70702 16.7072C6.31649 16.3167 6.31649 15.6835 6.70702 15.293L9.22174 12.7783C9.40927 12.5907 9.51463 12.3364 9.51463 12.0712V8.51481C9.51463 7.96253 9.96234 7.51481 10.5146 7.51481H14.071C14.3362 7.51481 14.5905 7.40946 14.7781 7.22192L17.2928 4.7072C17.6833 4.31668 18.3165 4.31668 18.707 4.7072L21.2217 7.22192Z'
        className='fill-white dark:fill-gray-900'
      />
      <path
        d='M23.3737 13.3739L16.6666 20.081L13.2928 16.7073L14.707 15.2931L16.6666 17.2526L21.9595 11.9597L23.3737 13.3739Z'
        className='fill-white'
      />
    </svg>
  )
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true) // Always start collapsed on SSR
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Mark mounted and load saved collapsed state
  useEffect(() => {
    setIsMounted(true)
    
    // Load saved collapsed state from cookie after mounting
    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )sidebar_collapsed=(true|false)/)
        if (match) {
          setIsCollapsed(match[1] === 'true')
        }
      }
    } catch {}
  }, [])

  // Load user profile
  useEffect(() => {
    const profile = userProfileService.getUserProfile()
    setUserProfile(profile)
    
    // Listen for profile updates (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradestial_user_profile') {
        const updatedProfile = userProfileService.getUserProfile()
        setUserProfile(updatedProfile)
      }
    }
    
    // Listen for profile updates (same-tab)
    const handleProfileUpdate = (e: CustomEvent) => {
      setUserProfile(e.detail)
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  // Use theme from context
  const isDarkMode = theme === 'dark'

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  // Handle logout
  const handleLogout = () => {
    authService.logout()
  }

  // Handle sidebar toggle with cookie persistence
  const toggleSidebar = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    try {
      document.cookie = `sidebar_collapsed=${String(collapsed)}; Path=/; Max-Age=31536000; SameSite=Lax`
    } catch {}
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 shadow-lg"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open mobile menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Toggle Button - Fixed position outside sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-250 fixed top-8"
        style={{ 
          left: isCollapsed ? '80px' : '240px',
          zIndex: 9999999,
          transition: 'left 0ms ease-out'
        }}
        onClick={() => toggleSidebar(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <Tooltip.Provider delayDuration={400} skipDelayDuration={100}>
        <motion.div
          id="mobile-navigation"
          role="navigation"
          aria-label="Main navigation"
          className={cn(
            "bg-[#f8f9f8] dark:bg-[#171717] text-gray-700 dark:text-white h-[100dvh] sticky top-0 overflow-y-auto flex flex-col relative border-r border-gray-200 dark:border-[#2a2a2a]",
            "fixed lg:sticky z-[9998] lg:z-auto",
            isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            isCollapsed ? "w-20" : "w-52"
          )}
          initial={false}
          animate={{
            width: isCollapsed ? '5rem' : '13rem'
          }}
          transition={{
            duration: 0,
            ease: 'easeOut'
          }}
        >
      {/* Logo */}
      <div className="py-2 flex items-center px-2 relative">
        <div className={cn("relative flex-shrink-0", isCollapsed ? "w-16 h-16" : "w-20 h-20")}>
          <Image
            src="/Branding/Tradestial.svg"
            alt="Tradestial Logo"
            width={isCollapsed ? 64 : 80}
            height={isCollapsed ? 64 : 80}
            className="object-contain w-full h-full"
          />
        </div>
{!isCollapsed && (
          <motion.div
            initial={isMounted ? { opacity: 0, width: 0 } : false}
            animate={isMounted ? { opacity: 1, width: "auto" } : { opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="-ml-4 flex-1 overflow-hidden"
          >
            <h1 className="text-2xl font-bold font-codec-pro text-[#333333] dark:text-[#F5F5F5] whitespace-nowrap">
              Tradestial
            </h1>
          </motion.div>
        )}
      </div>


      {/* Import Button */}
      <div className="px-4 pb-2">
        {isCollapsed ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Link href="/import-data">
                <FancyButton.Root 
                  variant="primary"
                  size="small"
                  className="!w-12 !h-9"
                >
                  <FancyButton.Icon as={Plus} />
                </FancyButton.Root>
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                side="right" 
                sideOffset={12}
                className="z-[9999] select-none rounded-md bg-gray-100 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-md will-change-[transform,opacity] data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade"
                avoidCollisions={true}
              >
                Import
                <Tooltip.Arrow className="fill-gray-100 dark:fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Link href="/import-data">
            <FancyButton.Root 
              variant="primary"
              size="medium"
              className="w-full gap-2"
            >
              <FancyButton.Icon as={Plus} />
              <span>Import Data</span>
            </FancyButton.Root>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <NavigationMenu.Root className="flex-1 pt-2 pb-4 px-3">
        <NavigationMenu.List className="space-y-1">
          {getEnabledNavigationItems().map((item) => {
            const isActive = pathname === item.href || (item.isActive && item.isActive(pathname))
            return (
              <NavigationMenu.Item key={item.label}>
                {isCollapsed ? (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <NavigationMenu.Link asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "w-full flex items-center rounded-lg text-left transition-all duration-200 text-sm relative group px-3.5 py-3 justify-center",
                            isActive 
                              ? "bg-white shadow-sm border border-gray-200 dark:bg-[#171717] dark:border-[#2a2a2a]" 
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#171717]"
                          )}
                        >
                          {isActive ? (
                            <GradientIcon Icon={item.icon} className="w-6 h-6 flex-shrink-0" />
                          ) : (
                            <item.icon className="w-6 h-6 flex-shrink-0" />
                          )}
                          {item.badge && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </Link>
                      </NavigationMenu.Link>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        side="right" 
                        sideOffset={12}
                        className="z-[9999] select-none rounded-md bg-gray-100 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-md will-change-[transform,opacity] data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade"
                        avoidCollisions={true}
                      >
                        {item.label}
                        <Tooltip.Arrow className="fill-gray-100 dark:fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : (
                  <NavigationMenu.Link asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex items-center rounded-lg text-left transition-all duration-200 text-sm relative group px-3.5 py-3 justify-start gap-3",
                        isActive 
                          ? "bg-white shadow-sm border border-gray-200 dark:bg-[#171717] dark:border-[#2a2a2a]" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#171717]"
                      )}
                    >
                      {isActive ? (
                        <GradientIcon Icon={item.icon} className="w-6 h-6 flex-shrink-0" />
                      ) : (
                        <item.icon className="w-6 h-6 flex-shrink-0" />
                      )}
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </Link>
                  </NavigationMenu.Link>
                )}
              </NavigationMenu.Item>
            )
          })}
        </NavigationMenu.List>
      </NavigationMenu.Root>

      {/* Divider above user section */}
      <div className="mx-3 my-2 border-t border-gray-200 dark:border-[#2a2a2a]" />

      {/* User Avatar with Dropdown */}
      <div className={cn("py-4 px-3 flex", isCollapsed ? "justify-center" : "justify-start")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("focus:outline-none flex items-center gap-3 w-full", isCollapsed ? "justify-center" : "justify-start")}>
              <div className="relative h-10 w-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all rounded-full overflow-hidden flex-shrink-0">
                {userProfile?.profilePicture ? (
                  <img 
                    key={userProfile.profilePicture}
                    src={userProfile.profilePicture} 
                    alt="Profile Picture"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center">
                    {userProfile?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <CustomVerifiedIconSVG className="w-4 h-4" />
                </div>
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={isMounted ? { opacity: 0, width: 0 } : false}
                  animate={isMounted ? { opacity: 1, width: "auto" } : { opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex-1 text-left overflow-hidden"
                >
                  <div className="text-sm font-semibold text-gray-700 dark:text-white truncate">
                    {userProfile?.fullName || 'User'}
                  </div>
                </motion.div>
              )}
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            side="top" 
            align="start"
            sideOffset={8}
            className="w-64 p-0 bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a]"
          >
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                {userProfile?.profilePicture ? (
                  <img 
                    key={userProfile.profilePicture}
                    src={userProfile.profilePicture} 
                    alt="Profile Picture"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center">
                    {userProfile?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <CustomVerifiedIconSVG className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700 dark:text-white">{userProfile?.fullName || 'User'}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {userProfile?.email || 'user@example.com'}
                </div>
              </div>
              <Badge.Root variant="light" color="green" size="medium">
                PRO
              </Badge.Root>
            </div>

            {/* Theme Toggle */}
            <div className="p-1">
              <div className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
                <Moon className="mr-3 h-4 w-4" />
                Dark Mode
                <div className="flex-1" />
                <div className="relative">
                  <Toggle.Root
                    pressed={isDarkMode}
                    onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}
                    aria-label="Toggle dark mode"
                    className={cn(
                      "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                      "data-[state=on]:bg-blue-600 data-[state=off]:bg-gray-200 dark:data-[state=off]:bg-gray-700"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        isDarkMode ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </Toggle.Root>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Menu Items */}
            <Link href="/settings">
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 cursor-pointer">
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <Link href="/account">
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 cursor-pointer">
                <UserCog className="mr-3 h-4 w-4" />
                Account Management
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300">
              <Activity className="mr-3 h-4 w-4" />
              Activity
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300">
              <LayoutGrid className="mr-3 h-4 w-4" />
              Integrations
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-gray-700 dark:text-gray-300">
              <Plus className="mr-3 h-4 w-4" />
              Add Account
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </DropdownMenuItem>

            <div className="p-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-[#2a2a2a]">
              v.1.5.69 · Terms & Conditions
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        </motion.div>
      </Tooltip.Provider>
    </>
  )
}