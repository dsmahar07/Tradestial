import React from 'react';
import { MageIcon } from './MageIcon';

interface DashboardIconProps {
  className?: string;
  size?: number | string;
}

export const DashboardIcon: React.FC<DashboardIconProps> = ({ className, size }) => {
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
      <path d="M7.67197 16.2224V11.1233" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.1233 16.2224L12.1233 7.77765" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M16.328 16.2224L16.328 9.8194" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
};