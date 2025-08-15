import React from 'react';
import { MageIcon } from './MageIcon';

interface AnalyticsIconProps {
  className?: string;
  size?: number | string;
}

export const AnalyticsIcon: React.FC<AnalyticsIconProps> = ({ className, size }) => {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2.74999" y="2.75" width="18.5" height="18.5" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 15L9.45 11.74C9.60003 11.5392 9.81998 11.4021 10.0663 11.3558C10.3126 11.3095 10.5673 11.3574 10.78 11.49L13.17 13C13.3909 13.1406 13.6581 13.1891 13.9142 13.1348C14.1704 13.0806 14.3951 12.9281 14.54 12.71L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};