import * as React from 'react';

import { cn } from '@/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  onEnterPress?: () => void;
  onDelPress?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onEnterPress, onDelPress, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-[#FFFFFF] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111113]',
          className,
        )}
        ref={ref}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(key) => {
          if (key.key === 'Enter') {
            onEnterPress?.();
          }
          if (key.key === 'Backspace' && key.currentTarget.value === '') {
            onDelPress?.();
          }
        }}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
