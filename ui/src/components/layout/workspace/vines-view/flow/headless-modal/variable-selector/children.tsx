import React from 'react';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card.tsx';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IVariableChildrenProps {
  name: string;
  children?: IVinesVariable[];
  onSelected?: (childId: string, childJsonpath: string, childTargetId: string) => void;
}

export const VariableChildren: React.FC<IVariableChildrenProps> = () => {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          icon={<ChevronRight />}
          variant="outline"
          className="-my-1 -mr-1 scale-75"
          onClick={(e) => e.stopPropagation()}
        />
      </HoverCardTrigger>
      <HoverCardContent
        className="flex cursor-default flex-col gap-2 p-2"
        side="right"
        onClick={(e) => e.stopPropagation()}
      >
        {/*<span className="text-xs text-muted-foreground">{name}</span>*/}
        {/*{children?.map(({ id, label, children, jsonpath, targetId }) => (*/}
        {/*  <div*/}
        {/*    key={id}*/}
        {/*    className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted"*/}
        {/*    onClick={() => onSelected?.(id, jsonpath, targetId)}*/}
        {/*  >*/}
        {/*    {label}*/}
        {/*    {children && children.length > 0 && (*/}
        {/*      <div className="flex flex-1 justify-end">*/}
        {/*        <VariableChildren name={label} onSelected={onSelected}>*/}
        {/*          {children}*/}
        {/*        </VariableChildren>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*))}*/}
      </HoverCardContent>
    </HoverCard>
  );
};
