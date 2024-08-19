import React from 'react';

import { cn } from '@/utils';

interface IVinesAbstractVideoProps {
  children: string;
  className?: string;
  autoPlay?: boolean;
}

export const VinesAbstractVideo: React.FC<IVinesAbstractVideoProps> = ({ children, className, autoPlay = true }) => {
  return (
    <div className={cn('overflow-hidden rounded-md shadow', className)}>
      <video autoPlay={autoPlay} className="max-h-96 w-full cursor-pointer" controls muted>
        <source src={children} />
      </video>
    </div>
  );
};
