/**
 * Authentication service for handling user login/logout operations
 */

export interface AuthService {
  logout(): void;
  isAuthenticated(): boolean;
  clearUserData(): void;
}

class AuthServiceImpl implements AuthService {
  private readonly STORAGE_KEYS = {
    USER_PROFILE: 'tradestial_user_profile',
    AUTH_TOKEN: 'tradestial_auth_token',
    THEME: 'tradestial-ui-theme',
    // Add other auth-related keys as needed
  };

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
      console.error('Error during logout:', error);
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
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
      const userProfile = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      
      // Basic check - you can enhance this with token validation
      return !!(token || userProfile);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();
