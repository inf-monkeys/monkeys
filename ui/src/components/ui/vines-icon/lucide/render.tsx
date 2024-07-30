import React, { createElement, memo } from 'react';

import { Icon } from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';
import { cn, toKebabCase } from '@/utils';

interface IRenderProps extends React.ComponentPropsWithoutRef<'svg'> {
  src: string;
}

export const LucideIconRender: React.FC<IRenderProps> = memo(({ src, className, ...attr }) => {
  const iconSVG = useAppStore((s) => s.iconSVG);

  const svg = (iconSVG?.[src] ?? []) as any;

  return createElement(Icon, {
    iconNode: svg,
    className: cn(`lucide-${toKebabCase(src)}`, className),
    ...attr,
  });
});

LucideIconRender.displayName = 'VinesLucideIconRender';
