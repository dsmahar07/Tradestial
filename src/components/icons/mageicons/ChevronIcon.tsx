import React from 'react';
import { MageIcon } from './MageIcon';

interface ChevronIconProps {
  className?: string;
  size?: number | string;
  direction: 'left' | 'right' | 'up' | 'down';
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({ className, size, direction }) => {
  const getPath = () => {
    switch (direction) {
      case 'right':
        return 'M9 18l6-6-6-6';
      case 'left':
        return 'M15 18l-6-6 6-6';
      case 'up':
        return 'M18 15l-6-6-6 6';
      case 'down':
        return 'M6 9l6 6 6-6';
      default:
        return 'M9 18l6-6-6-6';
    }
  };

  return (
    <MageIcon className={className} size={size}>
      <path d={getPath()} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </MageIcon>
  );
};