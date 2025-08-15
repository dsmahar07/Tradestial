import React from 'react';

interface MageIconProps {
  className?: string;
  size?: number | string;
  color?: string;
  fill?: string;
  children: React.ReactNode;
  viewBox?: string;
}

export const MageIcon: React.FC<MageIconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor',
  fill = 'currentColor',
  children,
  viewBox = '0 0 24 24'
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
};