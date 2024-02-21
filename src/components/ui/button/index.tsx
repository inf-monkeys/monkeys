import * as React from 'react';

import './index.scss';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { Spinner, SpinnerType } from '@/components/ui/spinner';
import { cn } from '@/utils';

const buttonVariants = cva(
  'items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-grayP3-3 bg-opacity-60 hover:bg-opacity-15 active:bg-opacity-20 text-[--text-color]',
        solid: 'bg-[--bg-color] text-primary-foreground hover:bg-[--bg-hover-color] active:bg-[--bg-active-color]',
      },
      theme: {
        primary: 'button-theme-primary',
        secondary: 'button-theme-secondary',
        tertiary: 'button-theme-tertiary',
        warning: 'button-theme-warning',
        danger: 'button-theme-danger',
      },
      size: {
        default: 'h-10 px-4 py-2',
        small: 'h-8 rounded-md px-3',
        large: 'h-12 rounded-md px-8',
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, theme, size, className, block }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {(loading || loadResult || icon) && (
          <div
            className={cn('[&>*]:h-4 [&>*]:w-4', {
              'mr-2': Boolean(children),
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
