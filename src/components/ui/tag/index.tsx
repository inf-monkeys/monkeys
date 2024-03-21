import React, { useEffect, useState } from 'react';

import './index.scss';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/utils';

const tagVariants = cva(
  'vines-tag px-[8px] py-[1px] cursor-default bg-opacity-65 rounded-sm flex items-center justify-center bg-[--bg-color]',
  {
    variants: {
      shape: {
        square: '',
        circle: 'rounded-xl',
      },
      size: {
        xs: 'h-[18px] text-xs',
        small: 'h-[22px] text-sm',
        large: 'h-[26px]',
      },
      color: {
        primary: 'tag-color-primary',
        secondary: 'tag-color-secondary',
        tertiary: 'tag-color-tertiary',
        warning: 'tag-color-warning',
        danger: 'tag-color-danger',
      },
      visible: {
        true: '',
        false: '!hidden',
      },
    },
    defaultVariants: {
      shape: 'square',
      size: 'small',
      color: 'tertiary',
      visible: true,
    },
  },
);

interface IconWrapperProps {
  children: React.ReactNode;
  size?: 'large' | 'small' | 'xs' | null;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ children, size = 'small' }) => {
  return (
    <div
      className={cn('mx-[2px]', {
        '[&_svg]:w-[14px]': size === 'xs',
        '[&_svg]:w-[18px]': size === 'small',
        '[&_svg]:w-[22px]': size === 'large',
      })}
    >
      {children}
    </div>
  );
};

export interface TagProps extends VariantProps<typeof tagVariants> {
  className?: string;
  closable?: boolean;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  tagKey?: string | number;
  onClick?: (tagChildren: React.ReactNode, e: MouseEvent, tagKey?: string | number) => void;
  onClose?: (tagChildren: React.ReactNode, e: MouseEvent, tagKey?: string | number) => void;
  children: React.ReactNode;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  (
    {
      className,
      shape = 'square',
      size = 'small',
      color = 'tertiary',
      visible = true,
      closable,
      prefixIcon,
      suffixIcon,
      tagKey,
      onClick,
      onClose,
      children,
    },
    ref,
  ) => {
    const [intoVisible, setIntoVisible] = useState(visible);

    useEffect(() => setIntoVisible(visible), [visible]);

    return (
      <div
        className={cn(
          tagVariants({
            shape,
            size,
            color,
            visible: intoVisible,
            className,
          }),
          onClick && 'cursor-pointer',
        )}
        onClick={(e) => {
          onClick?.(children, e.nativeEvent, tagKey);
        }}
        ref={ref}
      >
        {prefixIcon && <IconWrapper size={size}>{prefixIcon}</IconWrapper>}
        <span>{children}</span>
        {closable && (
          <span
            className="cursor-pointer"
            onClick={(e) => {
              onClose ? onClose?.(children, e.nativeEvent, tagKey) : setIntoVisible(false);
            }}
          >
            <IconWrapper size={size}>
              <X />
            </IconWrapper>
          </span>
        )}
        {suffixIcon && <IconWrapper size={size}>{suffixIcon}</IconWrapper>}
      </div>
    );
  },
);
Tag.displayName = 'Tag';

export { Tag };
