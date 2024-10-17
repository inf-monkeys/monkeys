import React, { useEffect } from 'react';

import { IVinesIconProps } from '@/components/ui/vines-icon';
import { LucideIconRender } from '@/components/ui/vines-icon/lucide/render.tsx';
import { splitEmojiLink } from '@/components/ui/vines-icon/utils.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const VinesLucideIconWithBackground: React.FC<IVinesIconProps> = ({
  src: propSrc,
  size = 'auto',
  style,
  className,
  children,
}) => {
  const initialized = useAppStore((s) => s.iconInitialized);
  useEffect(() => {
    if (!initialized) {
      VinesEvent.emit('vines-trigger-init-icons');
    }
  }, [initialized]);

  const src = (propSrc ?? children ?? '').toString().trim();
  const { text, backgroundColor } = splitEmojiLink(src);

  return (
    <div
      data-alt="icon"
      className={cn(
        'flex select-none items-center justify-center overflow-hidden font-bold',
        size !== 'auto' && size?.includes('l') && 'rounded-lg text-3xl',
        size !== 'auto' && !size?.includes('l') && 'rounded-md text-xl',
        size === 'auto' && 'h-full w-full',
        size === 'xs' && 'h-6 w-6 text-xs',
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 !text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
        size === 'xl' && 'h-14 w-14 text-base',
        size === '2xl' && 'h-16 w-16 text-2xl',
        size === '3xl' && 'h-20 w-20 text-2xl',
        size === 'gallery' && 'h-36 w-36 text-4xl',
        size === 'max' && 'h-48 w-48 !text-5xl',
        className,
      )}
      style={style}
    >
      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor }}>
        <LucideIconRender
          src={text}
          className={cn(
            'stroke-current text-black',
            (size === 'xl' || size === '2xl' || size === '3xl') && 'size-6',
            size === 'lg' && 'size-5',
            size === 'md' && 'size-4',
            size === 'sm' && 'size-3',
            size === 'xs' && 'size-2',
          )}
        />
      </div>
    </div>
  );
};
