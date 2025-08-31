'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'
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
import { Activity, LayoutGrid, Plus, LogOut, Moon, Settings, UserCog } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { getEnabledNavigationItems } from '@/config/navigation'

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
        d='M21.9288 7.51457C21.6636 7.51457 21.4092 7.40921 21.2217 7.22167L18.707 4.70696C18.3164 4.31643 17.6833 4.31643 17.2927 4.70696L14.778 7.22167C14.5905 7.40921 14.3361 7.51457 14.0709 7.51457H10.5146C9.96228 7.51457 9.51457 7.96228 9.51457 8.51457V12.0709C9.51457 12.3361 9.40921 12.5907 9.22167 12.778L6.70696 15.293C6.31643 15.6835 6.31643 16.3164 6.70696 16.707L9.22167 19.2217C9.40921 19.4092 9.51457 19.6636 9.51457 19.9288V23.4851C9.51457 24.0374 9.96228 24.4851 10.5146 24.4851H14.0709C14.3361 24.4851 14.5905 24.5905 14.778 24.778L17.2927 27.2927C17.6833 27.6833 18.3164 27.6833 18.707 27.2927L21.2217 24.778C21.4092 24.5905 21.6636 24.4851 21.9288 24.4851H25.4851C26.0374 24.4851 26.4851 24.0374 26.4851 23.4851V19.9288C26.4851 19.6636 26.5905 19.4092 26.778 19.2217L29.2927 16.707C29.6833 16.3164 29.6833 15.6833 29.2927 15.2927L26.778 12.778C26.5905 12.5907 26.4851 12.3361 26.4851 12.0709V8.51457C26.4851 7.96228 26.0374 7.51457 25.4851 7.51457H21.9288Z'
        fill='#47C2FF'
      />
      <path
        d='M23.3737 13.3739L16.6666 20.081L13.2928 16.7073L14.707 15.2931L16.6666 17.2526L21.9595 11.9597L23.3737 13.3739Z'
        className='fill-white'
      />
    </svg>
  )
}

export function Sidebar() {
  const isCollapsed = true // Permanently collapsed
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Use theme from context
  const isDarkMode = theme === 'dark'

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={100}>
      <div 
        className="bg-white dark:bg-[#171717] text-gray-900 dark:text-white h-[100dvh] sticky top-0 overflow-y-auto overflow-x-hidden flex flex-col border-r border-transparent dark:border-r-transparent w-20"
      >
      {/* Logo */}
      <div className="py-4 flex items-center justify-center px-5">
        <div className="w-8 h-8 relative">
          <Image
            src="/new-tradestial-logo.png"
            alt="Tradestial Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      </div>

      {/* Import Button */}
      <div className="px-4 pb-2">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Link href="/import-data">
              <Button 
                size="sm"
                className="w-12 h-9 relative bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-lg overflow-hidden transition duration-200 ease-out before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit] before:bg-gradient-to-b before:p-px before:from-white/[.12] before:to-transparent before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white after:to-transparent after:pointer-events-none after:opacity-[.16] after:transition after:duration-200 after:ease-out hover:after:opacity-[.24]"
              >
                <Plus className="w-4 h-4 relative z-10" />
              </Button>
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
      </div>

      {/* Navigation */}
      <NavigationMenu.Root className="flex-1 pt-2 pb-4 px-3">
        <NavigationMenu.List className="space-y-1">
          {getEnabledNavigationItems().map((item) => {
            const isActive = pathname === item.href || (item.isActive && item.isActive(pathname))
            return (
              <NavigationMenu.Item key={item.label}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <NavigationMenu.Link asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "w-full flex items-center rounded-lg text-left transition-all duration-200 text-sm relative group px-3.5 py-3 justify-center",
                          isActive 
                            ? "bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent text-blue-600 dark:text-blue-400 shadow-sm" 
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#171717]"
                        )}
                      >
                        <item.icon className="w-6 h-6 flex-shrink-0" />
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
              </NavigationMenu.Item>
            )
          })}
        </NavigationMenu.List>
      </NavigationMenu.Root>

      {/* User Avatar with Dropdown */}
      <div className="py-4 px-3 flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <Avatar.Root size="40" className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                <Avatar.Image 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Trader Avatar" 
                />
                <Avatar.Indicator position="top">
                  <CustomVerifiedIconSVG className="w-4 h-4" />
                </Avatar.Indicator>
                <Avatar.Fallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  TR
                </Avatar.Fallback>
              </Avatar.Root>
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
              <Avatar.Root size="40">
                <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" />
                <Avatar.Indicator position="top">
                  <CustomVerifiedIconSVG className="w-4 h-4" />
                </Avatar.Indicator>
              </Avatar.Root>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Alex Chen</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  alex@tradestial.com
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
            <DropdownMenuItem className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20">
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </DropdownMenuItem>

            <div className="p-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-[#2a2a2a]">
              v.1.5.69 · Terms & Conditions
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      </div>

    </Tooltip.Provider>
  )
}