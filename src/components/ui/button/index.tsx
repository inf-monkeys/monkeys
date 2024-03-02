import * as React from 'react';

import './index.scss';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { Spinner, SpinnerType } from '@/components/ui/spinner';
import { cn } from '@/utils';

const buttonVariants = cva(
  'vines-button items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gray-3 bg-opacity-60 hover:bg-opacity-15 active:bg-opacity-20 text-[--text-color]',
        solid: 'bg-[--bg-color] text-primary-foreground hover:bg-[--bg-hover-color] active:bg-[--bg-active-color]',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground [&_svg]:stroke-gold-12',
        borderless: 'hover:bg-gray-3 active:bg-opacity-20',
      },
      theme: {
        primary: 'button-theme-primary',
        secondary: 'button-theme-secondary',
        tertiary: 'button-theme-tertiary',
        warning: 'button-theme-warning',
        danger: 'button-theme-danger',
      },
      size: {
        default: 'h-9 px-4 py-2',
        icon: 'h-9 w-9',
        small: 'h-8 rounded-md px-3 text-xs',
        large: 'h-10 rounded-md px-5',
      },
      block: {
        false: 'inline-flex',
        true: 'block',
      },
    },
    defaultVariants: {
      variant: 'default',
      theme: 'primary',
      size: 'default',
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadResult?: SpinnerType;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      loading,
      loadResult,
      icon,
      disabled,
      theme,
      variant,
      size,
      block,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const hasChildren = Boolean(children);
    return (
      <Comp
        className={cn(buttonVariants({ variant, theme, size, className, block }), !hasChildren && 'h-auto p-2')}
        ref={ref}
        disabled={disabled || loading}
        data-variant={variant}
        {...props}
      >
        {(loading || loadResult || icon) && (
          <div
            className={cn('[&>*]:h-4 [&>*]:w-4', {
              'mr-2': hasChildren,
            })}
          >
            {loading || loadResult ? <Spinner loading={loading} type={loadResult} /> : icon ? icon : null}
          </div>
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button };
