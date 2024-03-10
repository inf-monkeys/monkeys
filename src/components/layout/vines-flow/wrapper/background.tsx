import React, { SVGProps } from 'react';

import { cn } from '@/utils';

type DotsProps = {
  gap: number;
  size?: number;
  scale?: number;
  onContextMenu?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
};

// million-ignore
export const DotsBackground: React.FC<SVGProps<SVGSVGElement> & DotsProps> = ({
  className,
  gap,
  size,
  scale,
  onContextMenu,
}) => {
  const gapScale = scale || 1;
  const [gapX, gapY] = Array.isArray(gap) ? gap : [gap, gap];
  const [dotWidth, dotHeight] = [gapX * gapScale || 1, gapY * gapScale || 1];
  const radius = (size || 1) / 2;

  return (
    <svg className={cn('absolute left-0 top-0 h-full w-full', className)} onContextMenu={onContextMenu}>
      <pattern id="vines-pattern" width={dotWidth} height={dotHeight} patternUnits="userSpaceOnUse">
        <circle className="fill-gold-12" cx={radius} cy={radius} r={radius} />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#vines-pattern)" data-id="vines-drag" />
    </svg>
  );
};
