import React from 'react';

import { isUndefined } from 'lodash';
import emojiRenderer from 'react-easy-emoji';
import isURL from 'validator/es/lib/isURL';

import { splitEmojiLink } from '@/components/ui/vines-icon/utils.ts';
import { cn } from '@/utils';

export type IVinesIconSize = 'auto' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'max' | 'gallery';

interface IVinesIconProps extends React.ComponentPropsWithoutRef<'div'> {
  src?: string;
  preClassName?: string;
  backgroundColor?: string;
  size?: IVinesIconSize;
  alt?: string;
}

export const VinesIcon: React.FC<IVinesIconProps> = ({
  src: propSrc,
  size = 'auto',
  style,
  preClassName,
  children,
  alt,
}) => {
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
        preClassName,
      )}
      style={style}
    >
      {isUndefined(src) ? (
        <div className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor }}>
          {isURL(src) ? <img src={src} alt={alt} /> : emojiRenderer(text, { protocol: 'https', ext: '.png' })}
        </div>
      )}
    </div>
  );
};
