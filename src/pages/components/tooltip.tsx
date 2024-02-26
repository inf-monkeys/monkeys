import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { TempComponentDemoWrapper } from '@/components/layout-wrapper/demo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type side = 'top' | 'right' | 'bottom' | 'left';

export const TooltipPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <a href="https://www.radix-ui.com/primitives/docs/components/tooltip#api-reference">API</a>
      <div className="flex gap-3 p-4">
        <TempComponentDemoWrapper title="props type & content type">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>children type</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip content={<p>Add to library</p>}>
            <Button>content type</Button>
          </Tooltip>
        </TempComponentDemoWrapper>
        <TempComponentDemoWrapper title="side">
          {(['top', 'right', 'bottom', 'left'] as side[]).map((side) => (
            <Tooltip key={side} content={<p>Add to library</p>} contentProps={{ side }}>
              <Button>{side}</Button>
            </Tooltip>
          ))}
        </TempComponentDemoWrapper>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/components/tooltip')({
  component: TooltipPage,
});
