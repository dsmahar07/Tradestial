import React from 'react';
import { MageIcon } from './MageIcon';

interface StatisticsIconProps {
  className?: string;
  size?: number | string;
}

export const StatisticsIcon: React.FC<StatisticsIconProps> = ({ className, size }) => {
  return (
    <MageIcon className={className} size={size}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </MageIcon>
  );
};