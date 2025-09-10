import { logger } from '@/lib/logger'

/**
 * Authentication service for handling user login/logout operations
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User;
  token: string;
  loginTime: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthState>;
  logout(): void;
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  getAuthState(): AuthState | null;
  clearUserData(): void;
}

class AuthServiceImpl implements AuthService {
  private readonly STORAGE_KEYS = {
    AUTH_DATA: 'tradestial_auth',
    USER_PROFILE: 'tradestial_user_profile',
    AUTH_TOKEN: 'tradestial_auth_token',
    THEME: 'tradestial-ui-theme',
    // Add other auth-related keys as needed
  };

  /**
   * Authenticates user with email and password
   */
  async login(email: string, password: string): Promise<AuthState> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation - in real app, this would be server-side
    if (!email.includes('@') || password.length < 6) {
      throw new Error('Invalid credentials');
    }

    const authState: AuthState = {
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split('@')[0]
      },
      token: 'demo_token_' + Math.random().toString(36).substr(2, 9),
      loginTime: new Date().toISOString()
    };

    // Store auth state
    localStorage.setItem(this.STORAGE_KEYS.AUTH_DATA, JSON.stringify(authState));
    
    return authState;
  }

  /**
   * Gets current authenticated user
   */
  getCurrentUser(): User | null {
    const authState = this.getAuthState();
    return authState?.user || null;
  }

  /**
   * Gets current auth state
   */
  getAuthState(): AuthState | null {
    try {
      const authData = localStorage.getItem(this.STORAGE_KEYS.AUTH_DATA);
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      logger.error('Error getting auth state:', error);
      return null;
    }
  }

  /**
   * Logs out the current user by clearing all stored data and redirecting to login
   */
  logout(): void {
    try {
      // Clear user data
      this.clearUserData();
      
      // Dispatch logout event for other components to listen to
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      logger.error('Error during logout:', error);
      // Force redirect even if there's an error
      window.location.href = '/login';
    }
  }

  /**
   * Clears all user-related data from localStorage
   */
  clearUserData(): void {
    try {
      // Clear specific auth-related items
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear any session storage as well
      sessionStorage.clear();
      
      // Dispatch event for profile update
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: null }));
    } catch (error) {
      logger.error('Error clearing user data:', error);
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  isAuthenticated(): boolean {
    try {
      const authState = this.getAuthState();
      
      if (!authState) return false;
      
      // Check if login is not too old (optional - 24 hours)
      const loginTime = new Date(authState.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLogin < 24; // Token expires after 24 hours
    } catch (error) {
      logger.error('Error checking authentication status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();
