import React from 'react';

import { useCreation } from 'ahooks';
import { isUndefined } from 'lodash';
import emojiRenderer from 'react-easy-emoji';
import isURL from 'validator/es/lib/isURL';

import { VinesImage } from '@/components/ui/image';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { splitEmojiLink } from '@/components/ui/vines-icon/utils.ts';
import { cn } from '@/utils';

export type IVinesIconSize = 'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'max' | 'gallery';

interface IVinesIconProps extends React.ComponentPropsWithoutRef<'div'> {
  src?: string;
  preClassName?: string;
  backgroundColor?: string;
  size?: IVinesIconSize;
  alt?: string;
  disabledPreview?: boolean;
}

export const VinesIcon: React.FC<IVinesIconProps> = ({
  src: propSrc,
  size = 'auto',
  style,
  preClassName,
  children,
  alt,
  disabledPreview,
}) => {
  const src = (propSrc ?? children ?? '').toString().trim();

  const { text, backgroundColor, type } = splitEmojiLink(src);

  const iconType = useCreation(() => {
    if (isURL(src)) return 'img';
    return type;
  }, [src, type]);

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
        preClassName,
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
            <VinesLucideIcon
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
          )}
        </div>
      )}
    </div>
  );
};
