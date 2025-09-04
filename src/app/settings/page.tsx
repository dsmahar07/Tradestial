'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Palette, HelpCircle, CreditCard, Upload, HardDrive } from 'lucide-react'
import { userProfileService, UserProfile } from '@/services/user-profile.service'

// Custom SVG Icons
const ProfileIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19.6177 21.25C19.6177 17.6479 15.6021 14.7206 12 14.7206C8.39794 14.7206 4.38235 17.6479 4.38235 21.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11.4559C14.404 11.4559 16.3529 9.50701 16.3529 7.10294C16.3529 4.69888 14.404 2.75 12 2.75C9.59594 2.75 7.64706 4.69888 7.64706 7.10294C7.64706 9.50701 9.59594 11.4559 12 11.4559Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const NotificationIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11.9737 16.2078H16.7603C16.9467 16.2181 17.1327 16.1806 17.3005 16.0988C17.4683 16.0169 17.6124 15.8934 17.7189 15.74C17.8254 15.5867 17.8909 15.4086 17.9092 15.2229C17.9275 15.037 17.8978 14.8496 17.8231 14.6785C17.5707 13.9139 16.5615 12.9963 16.5615 12.094C16.5615 10.0907 16.5615 9.56313 15.5751 8.3856C15.2553 8.00661 14.8593 7.69918 14.4128 7.48334L13.8623 7.21571C13.7697 7.1605 13.6897 7.0863 13.6278 6.99801C13.5659 6.90972 13.5233 6.80932 13.5029 6.70341C13.448 6.34659 13.2595 6.024 12.9755 5.80108C12.6915 5.57815 12.3334 5.47157 11.9737 5.50294C11.6203 5.48159 11.2717 5.59278 10.9959 5.81478C10.7203 6.03679 10.5372 6.35364 10.4827 6.70341C10.458 6.81272 10.4095 6.91528 10.3408 7.00381C10.2721 7.09233 10.1848 7.16468 10.085 7.21571L9.53451 7.48334C9.08807 7.69918 8.69206 8.00661 8.37227 8.3856C7.3859 9.56313 7.3859 10.0907 7.3859 12.094C7.3859 12.9963 6.42246 13.8221 6.17014 14.6327C6.01721 15.122 5.9331 16.2078 7.21003 16.2078H11.9737Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.2674 16.208C14.2737 16.511 14.2187 16.8121 14.1055 17.0931C13.9925 17.3743 13.8238 17.6297 13.6095 17.8439C13.3953 18.0582 13.1398 18.2269 12.8587 18.34C12.5776 18.4531 12.2766 18.5082 11.9736 18.5018C11.6706 18.5082 11.3696 18.4531 11.0884 18.34C10.8073 18.2269 10.5519 18.0582 10.3376 17.8439C10.1234 17.6297 9.95463 17.3743 9.84156 17.0931C9.72849 16.8121 9.67343 16.511 9.67968 16.208" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const SecurityIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17 9.6875H7C5.61929 9.6875 4.5 10.7228 4.5 12V18.9375C4.5 20.2147 5.61929 21.25 7 21.25H17C18.3807 21.25 19.5 20.2147 19.5 18.9375V12C19.5 10.7228 18.3807 9.6875 17 9.6875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.375 9.6875V7.375C7.375 6.14837 7.86228 4.97199 8.72963 4.10463C9.59699 3.23728 10.7734 2.75 12 2.75C13.2266 2.75 14.403 3.23728 15.2704 4.10463C16.1377 4.97199 16.625 6.14837 16.625 7.375V9.6875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.53128 17.7812H15.4688" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DataPrivacyIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M17.75 8.80515H16.3125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.7188 8.80515H6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.75 15.1948H11.2812" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.6875 15.1948H6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.48438 16.9917C10.4768 16.9917 11.2812 16.1872 11.2812 15.1948C11.2812 14.2024 10.4768 13.3979 9.48438 13.3979C8.49199 13.3979 7.6875 14.2024 7.6875 15.1948C7.6875 16.1872 8.49199 16.9917 9.48438 16.9917Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5156 10.602C15.508 10.602 16.3125 9.79753 16.3125 8.80515C16.3125 7.81276 15.508 7.00827 14.5156 7.00827C13.5232 7.00827 12.7188 7.81276 12.7188 8.80515C12.7188 9.79753 13.5232 10.602 14.5156 10.602Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import * as Select from '@radix-ui/react-select'
import * as Avatar from '@/components/ui/avatar'
import * as Separator from '@radix-ui/react-separator'
import { Button } from '@/components/ui/button'
import * as FancyButton from '@/components/ui/fancy-button'
import { useTheme } from '@/hooks/use-theme'
import { usePageTitle } from '@/hooks/use-page-title'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  usePageTitle('Settings')
  const { theme, setTheme } = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [tradeAlerts, setTradeAlerts] = useState(true)
  const [performanceReports, setPerformanceReports] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 * 1024 * 1024 }) // 5MB default limit
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    tradingExperience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'professional'
  })
  
  // Calculate localStorage usage
  const calculateStorageUsage = () => {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
        }
      }
    }
    return totalSize
  }

  // Load user profile and calculate storage on component mount
  useEffect(() => {
    const profile = userProfileService.getUserProfile()
    setUserProfile(profile)
    setFormData({
      fullName: profile.fullName,
      email: profile.email,
      tradingExperience: profile.tradingExperience
    })
    
    // Calculate storage usage
    const usedBytes = calculateStorageUsage()
    setStorageUsage(prev => ({ ...prev, used: usedBytes }))
  }, [])

  const isDarkMode = theme === 'dark'
  
  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const base64Image = await userProfileService.uploadProfilePicture(file)
      const updatedProfile = userProfileService.updateUserProfile({ profilePicture: base64Image })
      setUserProfile(updatedProfile)
      setSaveMessage('Profile picture updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setErrors({ profilePicture: error instanceof Error ? error.message : 'Failed to upload image' })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle form field changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  // Validate and save profile changes
  const handleSaveChanges = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate full name
    if (!userProfileService.validateFullName(formData.fullName)) {
      newErrors.fullName = 'Name must be between 2 and 50 characters'
    }
    
    // Validate email
    if (!userProfileService.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    try {
      const updatedProfile = userProfileService.updateUserProfile({
        fullName: formData.fullName,
        email: formData.email,
        tradingExperience: formData.tradingExperience
      })
      setUserProfile(updatedProfile)
      setSaveMessage('Profile updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setErrors({ general: 'Failed to save changes. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Reset form to original values
  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName,
        email: userProfile.email,
        tradingExperience: userProfile.tradingExperience
      })
    }
    setErrors({})
    setSaveMessage('')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 bg-gray-50 dark:bg-[#171717] p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Tabs.Root defaultValue="profile" className="w-full">
              <div className="flex gap-8">
                {/* Sidebar Navigation */}
                <div className="w-72 flex-shrink-0">
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm p-3">
                    <Tabs.List className="flex flex-col gap-1 w-full">
                      <Tabs.Trigger
                        value="profile"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <ProfileIcon className="w-4 h-4" />
                        <span>Profile</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="notifications"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <NotificationIcon className="w-4 h-4" />
                        <span>Notifications</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="security"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <SecurityIcon className="w-4 h-4" />
                        <span>Security</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="subscription"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Subscription</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="appearance"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <Palette className="w-4 h-4" />
                        <span>Appearance</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="data"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <DataPrivacyIcon className="w-4 h-4" />
                        <span>Data & Privacy</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                      <Separator.Root className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                      <Tabs.Trigger
                        value="support"
                        className="group relative flex items-center gap-3 w-full p-3 text-left rounded-lg text-sm font-medium transition-colors duration-200 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Help & Support</span>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r-full opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"></div>
                      </Tabs.Trigger>
                    </Tabs.List>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm">
                    
                    {/* Profile Tab */}
                    <Tabs.Content value="profile" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile Information</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Update your personal information and profile settings
                          </p>
                        </div>

                        {/* Profile Picture */}
                        <div className="flex items-center gap-4">
                          <Avatar.Root size="80">
                            <Avatar.Image src={userProfile?.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"} />
                            <Avatar.Fallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xl">
                              {userProfile?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'AC'}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureUpload}
                              className="hidden"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isLoading}
                              className="flex items-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {isLoading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              JPG, PNG or GIF (max. 5MB)
                            </p>
                            {errors.profilePicture && (
                              <p className="text-xs text-red-500 mt-1">{errors.profilePicture}</p>
                            )}
                          </div>
                        </div>

                        <Separator.Root className="h-px bg-gray-200 dark:bg-gray-700" />

                        {/* Success/Error Messages */}
                        {saveMessage && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">{saveMessage}</p>
                          </div>
                        )}
                        {errors.general && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
                          </div>
                        )}

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => handleInputChange('fullName', e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-0",
                                errors.fullName 
                                  ? "border-red-300 dark:border-red-600 focus:border-red-300 dark:focus:border-red-600"
                                  : "border-gray-300 dark:border-gray-600 focus:border-gray-300 dark:focus:border-gray-600"
                              )}
                            />
                            {errors.fullName && (
                              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-0",
                                errors.email 
                                  ? "border-red-300 dark:border-red-600 focus:border-red-300 dark:focus:border-red-600"
                                  : "border-gray-300 dark:border-gray-600 focus:border-gray-300 dark:focus:border-gray-600"
                              )}
                            />
                            {errors.email && (
                              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Trading Experience
                            </label>
                            <Select.Root value={formData.tradingExperience} onValueChange={(value) => handleInputChange('tradingExperience', value)}>
                              <Select.Trigger className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white flex items-center justify-between focus:outline-none focus:ring-0">
                                <Select.Value />
                                <Select.Icon />
                              </Select.Trigger>
                              <Select.Portal>
                                <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-1 z-50">
                                  <Select.Viewport>
                                    <Select.Item value="beginner" className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white">
                                      <Select.ItemText>Beginner (0-1 years)</Select.ItemText>
                                    </Select.Item>
                                    <Select.Item value="intermediate" className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white">
                                      <Select.ItemText>Intermediate (1-5 years)</Select.ItemText>
                                    </Select.Item>
                                    <Select.Item value="advanced" className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white">
                                      <Select.ItemText>Advanced (5+ years)</Select.ItemText>
                                    </Select.Item>
                                    <Select.Item value="professional" className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white">
                                      <Select.ItemText>Professional Trader</Select.ItemText>
                                    </Select.Item>
                                  </Select.Viewport>
                                </Select.Content>
                              </Select.Portal>
                            </Select.Root>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                            Cancel
                          </Button>
                          <FancyButton.Root 
                            variant="primary" 
                            size="medium" 
                            onClick={handleSaveChanges}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </FancyButton.Root>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Notifications Tab */}
                    <Tabs.Content value="notifications" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Notification Preferences</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Choose how you want to receive notifications about your trades and account
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                            </div>
                            <Switch.Root
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                              className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full data-[state=checked]:bg-blue-600 transition-colors relative"
                            >
                              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                            </Switch.Root>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications in your browser</p>
                            </div>
                            <Switch.Root
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                              className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full data-[state=checked]:bg-blue-600 transition-colors relative"
                            >
                              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                            </Switch.Root>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Trade Alerts</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when trades are executed or closed</p>
                            </div>
                            <Switch.Root
                              checked={tradeAlerts}
                              onCheckedChange={setTradeAlerts}
                              className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full data-[state=checked]:bg-blue-600 transition-colors relative"
                            >
                              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                            </Switch.Root>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Performance Reports</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly and monthly performance summaries</p>
                            </div>
                            <Switch.Root
                              checked={performanceReports}
                              onCheckedChange={setPerformanceReports}
                              className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full data-[state=checked]:bg-blue-600 transition-colors relative"
                            >
                              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                            </Switch.Root>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Subscription Tab */}
                    <Tabs.Content value="subscription" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Subscription Management</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Manage your subscription plan and billing preferences
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-6 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Tradestial Pro</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your current plan</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">$29/mo</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Active</div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited trades tracking
                              </div>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Advanced analytics & reports
                              </div>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Priority support
                              </div>
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                API access
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button variant="outline" size="sm">Change Plan</Button>
                              <Button variant="outline" size="sm">Manage Billing</Button>
                            </div>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Billing Information</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <p><span className="font-medium">Next billing date:</span> March 15, 2024</p>
                              <p><span className="font-medium">Payment method:</span> •••• •••• •••• 4242</p>
                              <p><span className="font-medium">Billing email:</span> alex@tradestial.com</p>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <h3 className="font-medium text-amber-900 dark:text-amber-200 mb-3">Cancel Subscription</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                              You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                            </p>
                            <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700">
                              Cancel Subscription
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Security Tab */}
                    <Tabs.Content value="security" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security Settings</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Manage your account security and authentication preferences
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                              <Switch.Root
                                checked={twoFactorAuth}
                                onCheckedChange={setTwoFactorAuth}
                                className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full data-[state=checked]:bg-blue-600 transition-colors relative"
                              >
                                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                              </Switch.Root>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Add an extra layer of security to your account
                            </p>
                            {twoFactorAuth && (
                              <Button variant="outline" size="sm">Configure 2FA</Button>
                            )}
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Change Password</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Last changed 3 months ago
                            </p>
                            <Button variant="outline" size="sm">Update Password</Button>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Active Sessions</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Manage devices that are currently logged into your account
                            </p>
                            <Button variant="outline" size="sm">View Sessions</Button>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Appearance Tab */}
                    <Tabs.Content value="appearance" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Appearance</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Customize the look and feel of your trading interface
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h3>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setTheme('light')}
                                className={cn(
                                  "p-3 rounded-lg border-2 transition-colors",
                                  theme === 'light' 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                )}
                              >
                                <div className="w-16 h-12 bg-white rounded border mb-2"></div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">Light</p>
                              </button>
                              <button
                                onClick={() => setTheme('dark')}
                                className={cn(
                                  "p-3 rounded-lg border-2 transition-colors",
                                  theme === 'dark' 
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                )}
                              >
                                <div className="w-16 h-12 bg-gray-800 rounded border mb-2"></div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">Dark</p>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Data & Privacy Tab */}
                    <Tabs.Content value="data" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Data & Privacy</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Control how your data is used and manage your privacy settings
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Storage Usage</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Local Storage</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {(storageUsage.used / 1024).toFixed(1)} KB / {(storageUsage.total / 1024 / 1024).toFixed(1)} MB
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <HardDrive className="w-3 h-3" />
                                <span>{((storageUsage.used / storageUsage.total) * 100).toFixed(1)}% used</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Data Export</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Download a copy of your trading data and account information
                            </p>
                            <Button variant="outline" size="sm">Export Data</Button>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Data Retention</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Your trading data is stored securely and retained according to our privacy policy
                            </p>
                            <Button variant="outline" size="sm">View Privacy Policy</Button>
                          </div>

                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <h3 className="font-medium text-red-900 dark:text-red-200 mb-3">Delete Account</h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700">
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Help & Support Tab */}
                    <Tabs.Content value="support" className="p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Help & Support</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Get help and support for your trading platform
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Documentation</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Learn how to use Tradestial with our comprehensive guides
                            </p>
                            <Button variant="outline" size="sm">View Docs</Button>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Support</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              Need help? Our support team is here to assist you
                            </p>
                            <Button variant="outline" size="sm">Contact Us</Button>
                          </div>

                          <div className="p-4 bg-white dark:bg-[#0f0f0f] rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">System Information</h3>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p>Version: 1.5.69</p>
                              <p>Build: 2024.03.15</p>
                              <p>Platform: Web</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>

                  </div>
                </div>
              </div>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </div>
  )
}