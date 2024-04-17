import * as React from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva, VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/utils';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-vines-500 data-[state=unchecked]:bg-grayA-8',
  {
    variants: {
      size: {
        default: 'h-6 w-11',
        small: 'h-[1.125rem] w-[2.075rem]',
        large: 'h-[1.875rem] w-[3.4375rem]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);
const switchThumbVariants = cva(
  'pointer-events-none block rounded-full shadow-lg ring-0 transition-all bg-opacity-100 text-vines-500 bg-whiteA-12',
  {
    variants: {
      size: {
        default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        small:
          'h-[0.95rem] w-[0.95rem] data-[state=checked]:translate-x-[0.95rem] data-[state=unchecked]:translate-x-0',
        large:
          'h-[1.5625rem] w-[1.5625rem] data-[state=checked]:translate-x-[1.5625rem] data-[state=unchecked]:translate-x-0',
      },
      loading: {
        false: '',
        true: 'bg-opacity-20',
      },
    },
    defaultVariants: {
      size: 'default',
      loading: false,
    },
  },
);
const switchIconVariants = cva('animate-spin', {
  variants: {
    size: {
      default: 'h-4 w-4',
      small: 'h-[0.7rem] w-[0.7rem]',
      large: 'h-[1.3125rem] w-[1.3125rem]',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, 'onChange'>,
    VariantProps<typeof switchVariants> {
  loading?: boolean;
  checked?: boolean;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size, loading, disabled, ...props }, ref) => (
    <SwitchPrimitives.Root
      className={cn(switchVariants({ size }), className)}
      disabled={loading || disabled}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size, loading }))}>
        <span className="flex h-full w-full items-center justify-center">
          {loading && <Loader2 className={cn(switchIconVariants({ size }))} />}
        </span>
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
