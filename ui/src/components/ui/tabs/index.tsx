import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/utils/index.ts';

export type TabsVariant = 'default' | 'ghost' | 'rounded';

const TabsVariantContext = React.createContext<TabsVariant>('default');

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    variant?: TabsVariant;
  }
>(({ variant = 'default', className, children, ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.Root ref={ref} className={cn('vines-tabs', className)} {...props}>
      {children}
    </TabsPrimitive.Root>
  </TabsVariantContext.Provider>
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    gap?: string;
  }
>(({ gap, className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);

  const variantStyles = {
    default:
      'bg-muted data-[orientation=horizontal]:h-10 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1 p-1 ',
    ghost:
      'bg-transparent data-[orientation=horizontal]:h-10 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1 p-1 ',
    rounded:
      'bg-transparent data-[orientation=horizontal]:h-12 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1',
  };

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        variantStyles[variant],
        'inline-flex items-center justify-center rounded-md text-muted-foreground',
        className,
      )}
      style={gap ? { gap } : undefined}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);

  const variantStyles = {
    default: 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
    ghost: 'data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-semibold',
    rounded: 'data-[state=active]:bg-vines-500 data-[state=active]:text-white rounded-3xl px-4 h-full glassy-border',
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-variant={variant}
      className={cn(
        'vines-tabs-trigger inline-flex w-full items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[orientation=vertical]:justify-start',
        variantStyles[variant],
        className,
      )}
      style={
        variant === 'rounded'
          ? {
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              boxShadow: 'inset 0px 0px 0px 0px rgba(0, 0, 0, 0.1)',
            }
          : {}
      }
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
