import * as React from 'react';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { isUndefined } from 'lodash';

import { cn } from '@/utils';

export interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'onChange'> {
  // onChange?: (value: number) => void;
  label?: string;
  disabledLabel?: boolean;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, label, value, disabledLabel = false, ...props }, ref) => (
    <div className="flex flex-col items-end gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
      {!disabledLabel && (
        <div className={cn('flex w-full justify-between', { 'justify-end': !label })}>
          {label && <span className="text-sm font-medium">{label}</span>}
          <span className="text-sm font-medium">{isUndefined(value?.[0]) ? 'NaN' : value[0]}</span>
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
          <SliderPrimitive.Range className="absolute h-full bg-gray-500 dark:bg-gray-400" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-1.5 cursor-grab rounded-sm border-0 bg-gray-700 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-300" />
      </SliderPrimitive.Root>
    </div>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
