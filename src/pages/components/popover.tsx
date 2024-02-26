import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { TempComponentDemoWrapper } from '@/components/layout-wrapper/demo';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type side = 'top' | 'right' | 'bottom' | 'left';

export const PopoverPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <a href="https://www.radix-ui.com/primitives/docs/components/popover#api-reference">API</a>
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="props type & content type">
          <Popover>
            <PopoverTrigger asChild>
              <Button>children type</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p>Add to library</p>
            </PopoverContent>
          </Popover>
          <Popover content={<p>Add to library</p>}>
            <Button>content type</Button>
          </Popover>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="side">
          {(['top', 'right', 'bottom', 'left'] as side[]).map((side) => (
            <Popover key={side} content={<p>Add to library</p>} contentProps={{ side }}>
              <Button>{side}</Button>
            </Popover>
          ))}
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="props">
          <Popover onOpenChange={setIsOpen} content={<p>Add to library</p>}>
            <Button>{isOpen ? 'close' : 'onOpenChange'}</Button>
          </Popover>
          <Popover open={isOpen2} content={<p>Add to library</p>}>
            <Button onClick={() => setIsOpen2(!isOpen2)}>state</Button>
          </Popover>
          <Popover defaultOpen content={<p>Add to library</p>}>
            <Button>defaultOpen</Button>
          </Popover>
          <Popover modal content={<p>Add to library</p>}>
            <Button>modal</Button>
          </Popover>
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/popover')({
  component: PopoverPage,
});
