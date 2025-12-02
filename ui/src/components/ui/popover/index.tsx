import React from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/utils';

const Popover: React.FC<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
    content?: React.ReactNode;
    contentProps?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
      container?: HTMLElement | null;
    };
  }
> = ({ content, contentProps, children, ...props }) => (
  <PopoverPrimitive.Popover {...props}>
    {content ? (
      <>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent {...contentProps}>{content}</PopoverContent>
      </>
    ) : (
      children
    )}
  </PopoverPrimitive.Popover>
);
Popover.displayName = PopoverPrimitive.Root.displayName;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /** Optional portal container; defaults to the top-most dialog content when present */
    container?: HTMLElement | null;
  }
>(({ className, align = 'center', sideOffset = 4, container, ...props }, ref) => {
  // When a Popover is rendered inside a Radix Dialog, the dialog's focus scope
  // prevents focusing elements that live outside of the dialog subtree.
  // By portaling the content into the dialog content element we avoid the focus
  // trap conflict and allow text inputs to receive focus.
  const fallbackContainer =
    typeof document !== 'undefined'
      ? (() => {
          const active = document.activeElement as HTMLElement | null;
          const byActive = active?.closest('[data-vines-dialog-content]');
          if (byActive) return byActive as HTMLElement;
          const openDialogs = Array.from(
            document.querySelectorAll<HTMLElement>('[data-vines-dialog-content][data-state="open"]'),
          );
          return openDialogs.at(-1);
        })()
      : undefined;

  return (
    <PopoverPrimitive.Portal container={container ?? fallbackContainer}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
          className,
        )}
        style={{ pointerEvents: 'auto' }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
