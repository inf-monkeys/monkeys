import * as React from 'react';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { isUndefined } from 'lodash';

import { cn } from '@/utils';

export interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'onChange'> {
  onChange?: (value: number) => void;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, onChange, value, ...props }, ref) => (
    <div className="flex flex-col items-end gap-2">
      <span className="text-sm">{isUndefined(value?.[0]) ? 'NaN' : value[0]}</span>
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        onChange={(e) => {
          onChange?.(Number((e as React.ChangeEvent<HTMLInputElement>).target.value));
        }}
        // value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };