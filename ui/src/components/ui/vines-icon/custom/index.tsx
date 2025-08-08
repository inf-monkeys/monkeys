import React, { forwardRef } from 'react';

import { cn } from '@/utils';

interface IVinesCustomIconProps extends React.ComponentPropsWithoutRef<'div'> {
  src: string;
  size?: number | string;
}

export const VinesCustomIcon = forwardRef<HTMLDivElement, IVinesCustomIconProps>(
  ({ src, className, size, style, ...props }, ref) => {
    const isSvgUrl = src.startsWith('http') || src.startsWith('data:image/svg');
    const svgContent = isSvgUrl ? null : src;

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {isSvgUrl ? (
          <img src={src} alt="custom icon" className="h-full w-full" />
        ) : (
          <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: svgContent || '' }} />
        )}
      </div>
    );
  },
);

VinesCustomIcon.displayName = 'VinesCustomIcon';
