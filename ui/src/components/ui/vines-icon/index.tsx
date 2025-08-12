import React, { useEffect, useMemo } from 'react';

import { isUndefined } from 'lodash';
import emojiRenderer from 'react-easy-emoji';
import isURL from 'validator/es/lib/isURL';

import { VinesImage } from '@/components/ui/image';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { splitEmojiLink } from '@/components/ui/vines-icon/utils.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events';

import { VinesCustomIcon } from './custom';

export type IVinesIconSize = 'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'max' | 'gallery';

export interface IVinesIconProps extends React.ComponentPropsWithoutRef<'div'> {
  src?: string;
  backgroundColor?: string;
  size?: IVinesIconSize;
  alt?: string;
  disabledPreview?: boolean;
  fallbackColor?: string;
}

export const VinesIcon: React.FC<IVinesIconProps> = ({
  src: propSrc,
  size = 'auto',
  style,
  className,
  children,
  alt,
  disabledPreview,
  fallbackColor,
}) => {
  const src = (propSrc ?? children ?? '').toString().trim();

  const initialized = useAppStore((s) => s.iconInitialized);
  const iconNames = useAppStore((s) => s.iconNames);

  useEffect(() => {
    if (!initialized) {
      VinesEvent.emit('vines-trigger-init-icons');
    }
  }, [initialized]);

  const iconType = useMemo(() => {
    if (src.startsWith('custom-icon:')) return 'custom-icon';
    if (src.startsWith('lucide:')) return 'lucide';
    if (iconNames.includes(src)) return 'lucide';
    if (isURL(src)) return 'img';
    return 'emoji';
  }, [src, iconNames]);

  const { text, backgroundColor } = splitEmojiLink(
    src,
    fallbackColor,
    iconType as 'emoji' | 'lucide' | 'img' | 'custom-icon',
  );

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
      {isUndefined(src) ? (
        <div className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor }}>
          {iconType === 'img' && <VinesImage src={src} alt={alt} disabled={disabledPreview} />}
          {iconType === 'emoji' && emojiRenderer(text, { protocol: 'https', ext: '.png' })}
          {iconType === 'lucide' && (
            <div
              className={cn(
                (size === 'xl' || size === '2xl' || size === '3xl') && 'size-7',
                size === 'lg' && 'size-6',
                size === 'md' && 'size-5',
                size === 'sm' && 'size-4',
                size === 'xs' && 'size-3',
              )}
            >
              <VinesLucideIcon src={text} className={cn('size-full stroke-current text-black')} />
            </div>
          )}
          {iconType === 'custom-icon' && (
            <div
              className={cn(
                (size === 'xl' || size === '2xl' || size === '3xl') && 'size-7',
                size === 'lg' && 'size-6',
                size === 'md' && 'size-5',
                size === 'sm' && 'size-4',
                size === 'xs' && 'size-3',
              )}
            >
              <VinesCustomIcon src={text} className={cn('size-full stroke-current text-black')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
