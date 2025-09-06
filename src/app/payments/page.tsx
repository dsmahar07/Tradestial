"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { 
  XMarkIcon
} from "@heroicons/react/24/outline";
import { 
  CheckCircleIcon
} from "@heroicons/react/24/solid";
import * as FancyButton from '@/components/ui/fancy-button';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn(
        "rounded-3xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-8", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-8 pb-8 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export default function PaymentsPage() {
  const [isYearly, setIsYearly] = React.useState(true);

  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              <span 
                style={{
                  background: 'linear-gradient(90deg, #4F7DFF 0%, #8B5CF6 50%, #F6B51E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '700',
                  fontSize: 'inherit'
                }}
              >
                Choose Your Trading Plan
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Unlock advanced trading analytics and insights with our flexible pricing options designed for traders of all levels.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none active:scale-95 hover:shadow-md ${
                  isYearly ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm active:scale-90 ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Yearly
              </span>
              {isYearly && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                  Save 20%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            {/* Basic Plan */}
            <div className="rounded-[32px] bg-[#fafcff] dark:bg-[#171717] ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-visible flex flex-col">
              {/* Header Section */}
              <div className="px-8 py-6 min-h-[200px]">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">BASIC</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Best for beginner traders</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${isYearly ? '16.67' : '20'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">/ Month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {isYearly ? 'billed $200 / year' : 'billed monthly'}
                  </p>
                </div>
              </div>
              
              {/* Inner container for features */}
              <div className="rounded-t-[24px] rounded-b-[32px] bg-white dark:bg-[#0f0f0f] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 flex-1">
                <div className="px-8 pb-8 pt-6 space-y-5">
                <FancyButton.Root 
                  variant="neutral" 
                  size="medium" 
                  className="mb-6 w-full h-12 cursor-pointer"
                  onClick={() => window.open('/signup', '_self')}
                >
                  Get started
                </FancyButton.Root>
                <div className="flex items-center gap-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Can add up to 2 accounts</span>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">2GB of secure data storage</span>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Create up to 5 Models</span>
                </div>
                <div className="flex items-center gap-4 opacity-50">
                  <XMarkIcon className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium line-through">Market Replay</span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      Coming Soon
                    </span>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-[32px] bg-[#fafcff] dark:bg-[#171717] ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-visible relative">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#335CFF]/10 to-[#FA7319]/10 blur-lg"></div>
              {/* Header Section */}
              <div className="px-8 py-6 relative z-10 min-h-[200px]">
                <h3 className="text-3xl mb-2">
                  <span 
                    style={{
                      background: 'linear-gradient(90deg, #4F7DFF 0%, #8B5CF6 50%, #F6B51E 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '700',
                      fontSize: 'inherit'
                    }}
                  >
                    PREMIUM
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Best for advanced traders</p>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-black dark:text-white">
                      ${isYearly ? '25' : '30'}
                    </span>
                    <span className="text-black dark:text-white text-lg font-medium">/ Month</span>
                  </div>
                  <p className="text-black dark:text-white text-sm">
                    {isYearly ? 'billed $300 / year' : 'billed monthly'}
                  </p>
                </div>
              </div>
              
              {/* Inner container for features */}
              <div className="rounded-t-[24px] rounded-b-[32px] bg-white dark:bg-[#0f0f0f] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                <div className="px-8 pb-8 pt-6 space-y-5">
                <FancyButton.Root 
                  variant="neutral" 
                  size="medium" 
                  className="mb-6 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  onClick={() => window.open('/signup', '_self')}
                >
                  Get Started
                </FancyButton.Root>
                  <div className="flex items-center gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-black dark:text-white font-medium">Connect UNLIMITED accounts</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-black dark:text-white font-medium">10GB of secure data storage</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-black dark:text-white font-medium">Unlimited Models</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="text-black dark:text-white font-medium">Market Replay</span>
                      <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Can I change plans anytime?</h4>
                <p className="text-gray-600 dark:text-gray-300">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing adjusts accordingly.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What brokers do you support?</h4>
                <p className="text-gray-600 dark:text-gray-300">We support major brokers including TradingView, Webull, TD Ameritrade, Interactive Brokers, and many more through CSV imports.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 dark:text-gray-300">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Is my trading data secure?</h4>
                <p className="text-gray-600 dark:text-gray-300">Yes, we use enterprise-grade encryption and security measures to protect your trading data and personal information.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600 dark:text-gray-300">Yes, you can cancel your subscription at any time. No long-term commitments required.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What if my broker CSV is not supported?</h4>
                <p className="text-gray-600 dark:text-gray-300">Simply send us your broker CSV file via Discord or email, and our development team will quickly add support for your specific broker format.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
