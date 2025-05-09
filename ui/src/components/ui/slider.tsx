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
  ({ className, value, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SliderPrimitive.Root
          ref={ref}
          className={cn('relative flex w-full touch-none select-none items-center', className)}
          value={value}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-md bg-[#E0E0E0] dark:bg-gray-700">
            <SliderPrimitive.Range className="absolute h-full bg-[#6C6C6C] dark:bg-gray-400" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-2 cursor-grab rounded-sm border-0 bg-[#6C6C6C] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-300" />
        </SliderPrimitive.Root>
      </div>
      <span className="min-w-10 text-right text-sm font-medium text-[#3F3E39]">
        {isUndefined(value?.[0]) ? 'NaN' : value[0]}
      </span>
    </div>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
