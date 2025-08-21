import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/utils/index.ts';

const TabsVariantContext = React.createContext<'default' | 'ghost'>('default');

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    variant?: 'default' | 'ghost';
  }
>(({ variant = 'default', children, ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.Root ref={ref} {...props}>
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
    default: 'bg-muted',
    ghost: 'bg-transparent',
  };

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        variantStyles[variant],
        'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground data-[orientation=horizontal]:h-10 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1',
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
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex w-full items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[orientation=vertical]:justify-start',
        variantStyles[variant],
        className,
      )}
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
