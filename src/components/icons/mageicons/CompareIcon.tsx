import React from 'react';

interface CompareIconProps {
  className?: string;
  size?: number | string;
}

export const CompareIcon: React.FC<CompareIconProps> = ({ className, size }) => {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M17.75 8.80515H16.3125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.7188 8.80515H6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.75 15.1948H11.2812" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.6875 15.1948H6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.48438 16.9917C10.4768 16.9917 11.2812 16.1872 11.2812 15.1948C11.2812 14.2024 10.4768 13.3979 9.48438 13.3979C8.49199 13.3979 7.6875 14.2024 7.6875 15.1948C7.6875 16.1872 8.49199 16.9917 9.48438 16.9917Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5156 10.602C15.508 10.602 16.3125 9.79753 16.3125 8.80515C16.3125 7.81276 15.508 7.00827 14.5156 7.00827C13.5232 7.00827 12.7188 7.81276 12.7188 8.80515C12.7188 9.79753 13.5232 10.602 14.5156 10.602Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};