import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset as floatingOffset,
  Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/utils';

interface IFloatingPopoverContext {
  open: boolean;
  setOpen: (open: boolean) => void;
  floatingStyles: React.CSSProperties;
  getReferenceProps: ReturnType<typeof useInteractions>['getReferenceProps'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  context: ReturnType<typeof useFloating>['context'];
  refs: ReturnType<typeof useFloating>['refs'];
}

const FloatingPopoverContext = createContext<IFloatingPopoverContext | null>(null);

export interface FloatingPopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  offset?: number;
  children: React.ReactNode;
}

export const FloatingPopover: React.FC<FloatingPopoverProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  offset = 8,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
    },
    [controlledOpen, onOpenChange],
  );

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [floatingOffset(offset), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'pointerdown',
  });
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const value = useMemo(
    () => ({ open, setOpen, floatingStyles, getReferenceProps, getFloatingProps, context, refs }),
    [context, floatingStyles, getFloatingProps, getReferenceProps, open, refs, setOpen],
  );

  return <FloatingPopoverContext.Provider value={value}>{children}</FloatingPopoverContext.Provider>;
};

export interface FloatingPopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const FloatingPopoverTrigger = React.forwardRef<HTMLElement, FloatingPopoverTriggerProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const ctx = useFloatingPopoverContext();
    const Comp: any = asChild ? Slot : 'button';

    return (
      <Comp
        {...ctx.getReferenceProps({
          ref: (node: HTMLElement) => {
            ctx.refs.setReference(node);
            if (typeof forwardedRef === 'function') {
              forwardedRef(node);
            } else if (forwardedRef) {
              (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
            }
          },
          type: asChild ? undefined : 'button',
          ...props,
        })}
      />
    );
  },
);
FloatingPopoverTrigger.displayName = 'FloatingPopoverTrigger';

export interface FloatingPopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  portal?: boolean;
}

export const FloatingPopoverContent = React.forwardRef<HTMLDivElement, FloatingPopoverContentProps>(
  ({ className, style, portal = true, ...props }, forwardedRef) => {
    const ctx = useFloatingPopoverContext();

    // 不打开时完全不渲染，避免默认展示和焦点干扰
    if (!ctx.open) return null;

    const content = (
      <FloatingFocusManager context={ctx.context} modal={false} returnFocus={false}>
        <div
          {...ctx.getFloatingProps({
            ref: (node: HTMLDivElement | null) => {
              ctx.refs.setFloating(node);
              if (typeof forwardedRef === 'function') {
                forwardedRef(node);
              } else if (forwardedRef) {
                (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }
            },
            className: cn(
              'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
              className,
            ),
            style: { ...ctx.floatingStyles, ...style },
            tabIndex: -1,
            ...props,
          })}
        />
      </FloatingFocusManager>
    );

    if (!portal) return content;

    return <FloatingPortal>{content}</FloatingPortal>;
  },
);
FloatingPopoverContent.displayName = 'FloatingPopoverContent';

function useFloatingPopoverContext() {
  const ctx = useContext(FloatingPopoverContext);
  if (!ctx) {
    throw new Error('FloatingPopover components must be used within <FloatingPopover>');
  }
  return ctx;
}
