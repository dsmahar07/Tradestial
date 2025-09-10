'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, X, Check, Upload as UploadIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { userProfileService, type UserProfile, type UserProfileUpdate } from '@/services/user-profile.service'
import { useToast } from '@/components/ui/notification-toast'
import { ALL_TIMEZONES, formatTimezoneOffset } from '@/utils/timezones'
import { Root as FancyButton, Icon as FancyButtonIcon } from '@/components/ui/fancy-button'

export default function SettingsPage() {
  usePageTitle('Settings')
  const router = useRouter()
  const { success: toastSuccess, error: toastError, warning: toastWarning, ToastContainer } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Form local state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [experience, setExperience] = useState<UserProfile['tradingExperience']>('intermediate')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [appTimezone, setAppTimezone] = useState<number>(0)
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true)
  const [marketingEmails, setMarketingEmails] = useState<boolean>(false)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const p = userProfileService.getUserProfile()
    setProfile(p)
    setFullName(p.fullName)
    setEmail(p.email)
    setExperience(p.tradingExperience)
    setTheme(p.theme ?? 'system')
    setAppTimezone(p.appTimezone ?? 0)
    setEmailNotifications(p.emailNotifications ?? true)
    setMarketingEmails(p.marketingEmails ?? false)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradestial_user_profile') {
        const updated = userProfileService.getUserProfile()
        setProfile(updated)
      }
    }
    const handleProfileUpdate = (e: CustomEvent) => {
      setProfile(e.detail)
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSaveProfile = () => {
    if (!userProfileService.validateFullName(fullName)) {
      toastError('Invalid name', 'Full name should be 2-50 characters long.')
      return
    }
    if (!userProfileService.validateEmail(email)) {
      toastError('Invalid email', 'Please enter a valid email address.')
      return
    }

    setIsSavingProfile(true)
    try {
      const updates: UserProfileUpdate = {
        fullName,
        email,
        tradingExperience: experience,
      }
      const updated = userProfileService.updateUserProfile(updates)
      setProfile(updated)
      toastSuccess('Profile updated', 'Your profile details have been saved.')
    } catch (err) {
      toastError('Failed to save profile', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePreferences = () => {
    setIsSavingPrefs(true)
    try {
      const updates: UserProfileUpdate = {
        theme,
        appTimezone,
        emailNotifications,
        marketingEmails,
      }
      const updated = userProfileService.updateUserProfile(updates)
      setProfile(updated)
      toastSuccess('Preferences saved', 'Your preferences have been updated.')
    } catch (err) {
      toastError('Failed to save preferences', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const handleUploadPicture = async (file: File) => {
    try {
      const base64 = await userProfileService.uploadProfilePicture(file)
      const updated = userProfileService.updateUserProfile({ profilePicture: base64 })
      setProfile(updated)
      toastSuccess('Profile picture updated', 'Your new picture has been saved.')
    } catch (err) {
      toastError('Failed to upload picture', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleExport = () => {
    try {
      const data = userProfileService.exportUserData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tradestial-user-data.json'
      a.click()
      URL.revokeObjectURL(url)
      toastSuccess('Exported', 'Your data has been exported as JSON.')
    } catch (err) {
      toastError('Failed to export', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleClear = () => {
    if (!confirm('Are you sure you want to clear your local profile data? This cannot be undone.')) return
    try {
      userProfileService.clearUserData()
      const p = userProfileService.getUserProfile()
      setProfile(p)
      setFullName(p.fullName)
      setEmail(p.email)
      setExperience(p.tradingExperience)
      setTheme(p.theme ?? 'system')
      setAppTimezone(p.appTimezone ?? 0)
      setEmailNotifications(p.emailNotifications ?? true)
      setMarketingEmails(p.marketingEmails ?? false)
      toastWarning('Cleared', 'Your local user data has been reset to defaults.')
    } catch (err) {
      toastError('Failed to clear', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      {/* Header */}
      <div className="max-w-5xl mx-auto px-5 py-5 mb-10 relative flex items-center justify-between">
        <FancyButton variant="basic" size="xsmall" onClick={() => router.push('/dashboard')}>
          <FancyButtonIcon as={ArrowLeft} />
        </FancyButton>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 text-center">
          <div className="text-base md:text-lg text-[#636A9D] font-semibold">Your account</div>
          <div className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">Settings</div>
        </div>
        <FancyButton variant="basic" size="xsmall" onClick={() => router.push('/dashboard')}>
          <FancyButtonIcon as={X} />
        </FancyButton>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-5 pb-14">
        {/* Left column: Profile */}
        <div className="lg:col-span-1 p-6 rounded-lg bg-white">
          <h2 className="text-base font-medium text-[#636A9D] mb-4">Profile</h2>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden shadow">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-semibold">
                  {(fullName || 'User').split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <FancyButton variant="neutral" size="small" onClick={() => fileInputRef.current?.click()}>
                <FancyButtonIcon as={UploadIcon} />
                Upload picture
              </FancyButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPicture(f) }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#636A9D] mb-1">Full name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#636A9D] mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#636A9D] mb-1">Experience</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={experience}
                onChange={(e) => setExperience(e.target.value as UserProfile['tradingExperience'])}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <FancyButton
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                variant="primary"
                size="medium"
              >
                Save profile
              </FancyButton>
              <FancyButton
                variant="basic"
                size="medium"
                onClick={() => {
                  if (!profile) return
                  setFullName(profile.fullName)
                  setEmail(profile.email)
                  setExperience(profile.tradingExperience)
                }}
              >
                Reset
              </FancyButton>
            </div>
          </div>
        </div>

        {/* Right column: Preferences, Notifications, Data */}
        <div className="lg:col-span-2 space-y-8">
          {/* Preferences */}
          <div className="p-6 rounded-lg bg-white">
            <h2 className="text-base font-medium text-[#636A9D] mb-4">Preferences</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#636A9D] mb-1">Theme</label>
                <div className="flex items-center gap-2">
                  {(['light','dark','system'] as const).map((t) => (
                    <FancyButton
                      key={t}
                      size="small"
                      variant={theme === t ? 'neutral' : 'basic'}
                      onClick={() => setTheme(t)}
                    >
                      {t[0].toUpperCase() + t.slice(1)}
                    </FancyButton>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-1">
                  <label className="text-sm font-medium text-[#636A9D]">Application time zone</label>
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center">
                    <span className="text-white text-xs">i</span>
                  </div>
                </div>

                {/* Custom Dropdown similar to Upload page */}
                <div className="relative mt-2" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors flex items-center justify-between shadow-sm"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="text-gray-900">
                      {(() => {
                        const selectedTz = ALL_TIMEZONES.find(tz => tz.value === appTimezone)
                        return selectedTz ? `${formatTimezoneOffset(selectedTz.value)} ${selectedTz.label}` : 'Select timezone'
                      })()}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {ALL_TIMEZONES
                        .sort((a, b) => a.value - b.value)
                        .map((tz, index) => (
                          <button
                            key={`${tz.label}-${index}`}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:bg-purple-100 transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => { setAppTimezone(tz.value); setIsDropdownOpen(false) }}
                          >
                            {formatTimezoneOffset(tz.value)} {tz.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">This time zone will be used to display dates and times across the app.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <FancyButton
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
                variant="primary"
                size="medium"
              >
                Save preferences
              </FancyButton>
              <FancyButton
                variant="basic"
                size="medium"
                onClick={() => {
                  if (!profile) return
                  setTheme(profile.theme ?? 'system')
                  setAppTimezone(profile.appTimezone ?? 0)
                  setEmailNotifications(profile.emailNotifications ?? true)
                  setMarketingEmails(profile.marketingEmails ?? false)
                }}
              >
                Reset
              </FancyButton>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 rounded-lg bg-white">
            <h2 className="text-base font-medium text-[#636A9D] mb-4">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${emailNotifications ? 'text-green-600' : 'text-gray-300'}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email notifications</div>
                    <div className="text-xs text-gray-500">Receive important updates and alerts to your email.</div>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${marketingEmails ? 'text-green-600' : 'text-gray-300'}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Product tips & marketing</div>
                    <div className="text-xs text-gray-500">Occasional emails about new features and tips.</div>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} />
              </label>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  )
}
