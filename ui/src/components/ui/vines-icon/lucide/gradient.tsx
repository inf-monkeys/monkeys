import React, { useId } from 'react';

import { get } from 'lodash';
import type { LucideIcon } from 'lucide-react';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { cn } from '@/utils';

interface ILucideIconGradientProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

function parseLinearGradient(cssGradient: string) {
  const match = cssGradient.match(/linear-gradient\(([^,]+),(.+)\)/i);
  if (!match) return null;

  const angle = match[1].trim();
  const stops = match[2]
    .split(',')
    .map((s) => s.trim())
    .map((stop) => {
      const [color, offset] = stop.split(/\s+/);
      return { color, offset: offset || '0%' };
    });

  // 角度转成 x1,y1,x2,y2
  const deg = parseFloat(angle);
  const rad = ((450 - deg) % 360) * (Math.PI / 180); // SVG y 轴方向不同，需要转换
  const x1 = 0.5 + Math.cos(rad + Math.PI) * 0.5;
  const y1 = 0.5 + Math.sin(rad + Math.PI) * 0.5;
  const x2 = 0.5 + Math.cos(rad) * 0.5;
  const y2 = 0.5 + Math.sin(rad) * 0.5;

  return { x1, y1, x2, y2, stops };
}

export const LucideIconGradient: React.FC<ILucideIconGradientProps> = ({ icon: Icon, size = 24, className }) => {
  const gradientId = useId();

  const { data: oem } = useSystemConfig();

  const gradient = get(oem, 'theme.gradient', undefined) as ISystemConfig['theme']['gradient'];

  const parsed = gradient ? parseLinearGradient(gradient) : null;

  if (!parsed) {
    return <Icon size={size} className={className} />;
  }

  return (
    <div className={cn('inline-block', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" className="size-full">
        <defs>
          <linearGradient id={gradientId} x1={parsed.x1} y1={parsed.y1} x2={parsed.x2} y2={parsed.y2}>
            {parsed.stops.map((stop, idx) => (
              <stop key={idx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <Icon size={24} stroke={`url(#${gradientId})`} />
      </svg>
    </div>
  );
};
