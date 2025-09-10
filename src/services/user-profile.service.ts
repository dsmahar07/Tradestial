import { logger } from '@/lib/logger'

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  tradingExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  // Optional preferences for Settings page
  theme?: 'light' | 'dark' | 'system';
  appTimezone?: number; // minutes offset from UTC (matches utils/timezones values)
  emailNotifications?: boolean;
  marketingEmails?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  fullName?: string;
  email?: string;
  profilePicture?: string;
  tradingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  // Optional preferences updates
  theme?: 'light' | 'dark' | 'system';
  appTimezone?: number;
  emailNotifications?: boolean;
  marketingEmails?: boolean;
}

class UserProfileService {
  private readonly STORAGE_KEY = 'tradestial_user_profile';

  // Get current user profile
  getUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Error loading user profile:', error);
    }

    // Return default profile if none exists
    const defaultProfile: UserProfile = {
      id: 'user_' + Date.now(),
      fullName: 'User',
      email: '',
      tradingExperience: 'beginner',
      // Defaults for preferences
      theme: 'system',
      appTimezone: 0, // UTC by default
      emailNotifications: true,
      marketingEmails: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  // Update user profile
  updateUserProfile(updates: UserProfileUpdate): UserProfile {
    const currentProfile = this.getUserProfile();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  }

  // Save profile to localStorage
  private saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: profile }));
    } catch (error) {
      logger.error('Error saving user profile:', error);
      throw new Error('Failed to save profile changes');
    }
  }

  // Upload and process profile picture
  async uploadProfilePicture(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (JPG, PNG, or GIF)'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('File size must be less than 5MB'));
        return;
      }

      // Convert to base64 for localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        resolve(base64String);
      };
      reader.onerror = () => {
        reject(new Error('Failed to process image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate full name
  validateFullName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  // Export user data
  exportUserData(): string {
    const profile = this.getUserProfile();
    return JSON.stringify(profile, null, 2);
  }

  // Clear user data
  clearUserData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const userProfileService = new UserProfileService();
