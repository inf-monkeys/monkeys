import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as HoverCard from '@radix-ui/react-hover-card';

import { ILagRadarConfig, lagRadar } from '@/components/devtools/lag-radar/utils';
import { cn } from '@/utils';

export interface ILagRadarProps
  extends React.ComponentPropsWithoutRef<typeof HoverCard.Root>,
    Omit<ILagRadarConfig, 'parent'> {}

export const LagRadar: React.FC<ILagRadarProps> = ({ frames, speed, size, inset, ...props }) => {
  const [visible, setVisible] = useState(false);

  const initialRef = useRef(false);
  const nodeRef = useCallback((node: HTMLDivElement) => {
    if (node && !initialRef.current) {
      initialRef.current = true;
      const { width, height } = node.getBoundingClientRect();
      lagRadar({
        frames,
        speed,
        size: size || Math.min(width, height) - 16,
        inset,
        parent: node,
      });
    }
  }, []);
  useEffect(() => void (!visible && setTimeout(() => (initialRef.current = false), 16)), [visible]);

  return (
    <HoverCard.Root open={visible} onOpenChange={(val) => val && setVisible(true)} {...props}>
      <HoverCard.Trigger asChild>
        <div
          className={cn(
            'fixed bottom-0 right-0 z-[9999999999] h-1/2 w-3 cursor-pointer bg-black opacity-0 transition-opacity hover:opacity-5',
            visible && 'pointer-events-none !opacity-0',
          )}
          onClick={() => setVisible(true)}
        />
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="fixed bottom-4 right-4 z-[9999999999] size-24 cursor-pointer rounded-md bg-white bg-opacity-5 p-2 shadow-md backdrop-blur-md transition-opacity animate-in fade-in-0 zoom-in-95 hover:opacity-25 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          onClick={() => setVisible(false)}
          ref={nodeRef}
        />
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};
