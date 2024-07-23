import * as React from 'react';
import { useRef } from 'react';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { useDataScrollOverflow } from '@/hooks/use-data-scroll-overflow.ts';
import { cn } from '@/utils';

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  scrollBarDisabled?: boolean;
  disabledOverflowMask?: boolean;
}

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  ({ className, children, scrollBarDisabled = false, disabledOverflowMask = false, ...props }, ref) => {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);

    useDataScrollOverflow({
      domRef: scrollAreaRef,
      updateDeps: [children],
      isEnabled: !disabledOverflowMask,
    });

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn('relative overflow-hidden', className, scrollBarDisabled && 'no-scrollbar')}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={scrollAreaRef}
          className="size-full rounded-[inherit] data-[top-bottom-scroll=true]:[mask-image:linear-gradient(#000,#000,transparent_0,#000_40px,#000_calc(100%_-_40px),transparent)] data-[top-scroll=true]:[mask-image:linear-gradient(0deg,#000_calc(100%_-_40px),transparent)] data-[bottom-scroll=true]:[mask-image:linear-gradient(180deg,#000_calc(100%_-_40px),transparent)]"
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar className={cn(scrollBarDisabled && 'size-0 p-0')} />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  },
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
