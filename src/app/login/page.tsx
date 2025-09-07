'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/notification-toast';
import { authService } from '@/services/auth.service';
import * as FancyButton from '@/components/ui/fancy-button';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { success, error, ToastContainer } = useToast();
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-[400px] h-[560px] rounded-3xl border border-gray-200 shadow-xl p-6 flex flex-col">
        {/* Logo */}
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white">
          <span className="text-lg">✶</span>
        </div>
        <h1 className="text-center text-xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-gray-600">Please enter your details to login.</p>

        <form className="mt-4 space-y-4 flex-1" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@alignui.com" 
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">Password</label>
            <div className="mt-1 relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••" 
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" 
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Forgot password?</span>
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Reset it
            </button>
          </div>

          <FancyButton.Root 
            type="submit" 
            variant="neutral" 
            size="medium" 
            className="w-full cursor-pointer"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </FancyButton.Root>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3 text-sm text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span>OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
          <button 
            type="button"
            onClick={() => handleSocialLogin('apple')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => router.push('/signup')}
            className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Register
          </button>
        </p>
      </div>
      <ToastContainer />
    </main>
  );

  // Authentication handlers
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      error('Missing credentials', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.login(email, password);
      success('Login successful', 'Welcome back to Tradestial!');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      error('Login failed', err instanceof Error ? err.message : 'Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    if (!email) {
      error('Email required', 'Please enter your email address first.');
      return;
    }

    // Simulate password reset
    success('Reset link sent', `Password reset instructions have been sent to ${email}`);
  }

  function handleSocialLogin(provider: 'google' | 'apple') {
    // Simulate social login
    success('Coming soon', `${provider === 'google' ? 'Google' : 'Apple'} login will be available soon.`);
  }
}
