import React, { createContext, forwardRef, useContext, useMemo, useRef } from 'react';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { CustomContainerComponentProps, Virtualizer } from 'virtua';

import {
  IVinesExecutionResultItem,
  VirtuaExecutionResultGridItem,
} from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { mergeRefs } from '@/utils/merge-refs.ts';

const RefContext = createContext<React.RefCallback<Element>>(null!);
const Container = forwardRef<HTMLDivElement, CustomContainerComponentProps>((props, ref) => {
  const animationParent = useContext(RefContext);
  return <div ref={useMemo(() => mergeRefs([ref, animationParent]), [ref, animationParent])} {...props} />;
});
Container.displayName = 'VirtuaExecutionResultGridContainer';

interface IVirtuaExecutionResultGridProps {
  data: IVinesExecutionResultItem[][];

  height: number;
}

export const VirtuaExecutionResultGrid: React.FC<IVirtuaExecutionResultGridProps> = ({ data, height }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [animationParent, enable] = useAutoAnimate();
  const scrolling = useRef(false);

  return (
    <RefContext.Provider value={animationParent}>
      <ScrollArea
        className="-pr-0.5 mr-0.5 [&>[data-radix-scroll-area-viewport]]:p-2"
        ref={scrollRef}
        style={{ height }}
        disabledOverflowMask
      >
        <Virtualizer
          scrollRef={scrollRef}
          as={Container}
          onScroll={() => {
            const prevScrolling = scrolling.current;
            scrolling.current = true;
            if (prevScrolling !== scrolling.current) {
              enable(false);
            }
          }}
          onScrollEnd={() => {
            scrolling.current = false;
            enable(true);
          }}
          overscan={2}
        >
          {data.map((it, i) => (
            <VirtuaExecutionResultGridItem data={it} key={i} />
          ))}
        </Virtualizer>
      </ScrollArea>
    </RefContext.Provider>
  );
};
