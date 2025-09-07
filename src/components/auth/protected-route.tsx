'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useCustomEventListener } from '@/hooks/use-event-listener';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Use custom event listeners with automatic cleanup
  useCustomEventListener('userLoggedOut', () => {
    setIsAuthenticated(false);
    router.push('/login');
  });

  useCustomEventListener('userProfileUpdated', () => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      router.push('/login');
    }
  });

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
