import React, { memo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useSortable } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

import { IPageType } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { useRetimer } from '@/utils/use-retimer.ts';

interface ISpaceTabProps extends React.ComponentPropsWithoutRef<'div'> {
  id: string;
  displayName: string;
  icon: string;
  activeIndex: number;
  index: number;
  isLastItem: boolean;
  pages: IPageType[];
  page: IPageType | null;
}

export const SpaceTab: React.FC<ISpaceTabProps> = memo(
  ({ id, displayName, icon, activeIndex, index, isLastItem, pages, page }) => {
    const navigate = useNavigate({ from: Route.fullPath });
    const reTimer = useRetimer();

    const { loading, setLoading } = usePageStore();

    const { setNodeRef, listeners, attributes, transform, isDragging } = useSortable({ id });

    const isActive = activeIndex === index;

    const handleChangePage = () => {
      !isActive &&
        navigate({
          to: '/$teamId/workspace/$workflowId/$pageId',
          params: {
            pageId: id,
          },
        });

      const nextPageIsIdentical = pages?.find((page) => page._id === id)?.type === page?.type;
      reTimer(setTimeout(() => setLoading(false), nextPageIsIdentical ? 200 : 5000) as unknown as number);
    };

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
    };

    return (
      <motion.div
        ref={setNodeRef}
        className={cn(
          'group relative h-full rounded-t-xl after:absolute after:-right-3 after:bottom-0 after:z-10 after:h-3 after:w-3',
          isActive
            ? 'z-20 bg-slate-1 before:bg-[radial-gradient(circle_at_0_0,transparent_0.75rem,rgb(var(--slate1)/80)_0.75rem)] after:z-20 after:bg-[radial-gradient(circle_at_100%_0,transparent_0.75rem,rgb(var(--slate1)/80)_0.75rem)]'
            : 'hover:z-10 hover:bg-slate-1/70 after:hover:bg-[radial-gradient(circle_at_100%_0,transparent_0.75rem,rgb(var(--slate1)/70)_0.75rem)]',
          index !== 0 && 'before:absolute before:-left-3 before:bottom-0 before:z-10 before:h-3 before:w-3',
        )}
        onClick={handleChangePage}
        onContextMenu={handleContextMenu}
        layoutId={id}
        animate={transform ? { x: transform.x, y: transform.y } : { x: 0, y: 0 }}
        transition={{
          duration: !isDragging ? 0.25 : 0,
          easings: {
            type: 'spring',
          },
        }}
        exit={{ opacity: 0 }}
        {...attributes}
      >
        <div className="flex h-full select-none items-center p-4" {...listeners}>
          <p className="mr-2">{icon}</p>
          <h1 className="whitespace-nowrap text-sm font-bold">{displayName}</h1>
          <AnimatePresence>
            {isActive && (
              <motion.div
                key={id + '_more_button'}
                initial={{ width: 0, paddingLeft: 0 }}
                animate={{ width: 40, paddingLeft: 8 }}
                exit={{ width: 0, paddingLeft: 0 }}
                className="overflow-clip"
              >
                <Button
                  className="!scale-90 [&_svg]:stroke-gold-12"
                  icon={<MoreVertical />}
                  variant="borderless"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {}}
                />
              </motion.div>
            )}
            {!isActive && isLastItem && activeIndex - 1 !== index ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 z-10 h-4 transition-opacity group-hover:!opacity-0"
              >
                <Separator orientation="vertical" className="h-full" />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  },
);

SpaceTab.displayName = 'SpaceTab';
