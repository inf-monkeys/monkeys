import React, { memo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useSortable } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { IPageType } from '@/apis/pages/typings.ts';
import { TabMenu } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

const EMOJI2LUCIDE_MAPPER = {
  '🚀': 'square-function',
  '📃': 'square-kanban',
  '📷': 'square-menu',
  '💬': 'square-play',
};

interface ISpaceTabProps extends React.ComponentPropsWithoutRef<'div'> {
  id: string;
  displayName: string;
  icon: string;
  activeIndex: number;
  index: number;
  pages: IPageType[];
  page: IPageType | null;
}

export const SpaceTab: React.FC<ISpaceTabProps> = memo(({ id, displayName, icon, activeIndex, index }) => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });

  const setApiDocumentVisible = usePageStore((s) => s.setApiDocumentVisible);

  const { setNodeRef, listeners, attributes, transform, isDragging } = useSortable({ id });

  const isActive = activeIndex === index;

  const handleChangePage = () => {
    if (!isActive) {
      setApiDocumentVisible(false);
      void navigate({
        to: '/$teamId/workspace/$workflowId/$pageId',
        params: {
          pageId: id,
        },
      });
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        'relative w-full cursor-pointer select-none items-center rounded-md border border-transparent p-2 text-sm hover:bg-mauve-2 hover:bg-opacity-70',
        isActive && 'border-input bg-mauve-2 font-medium',
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
      <div className="flex h-full select-none items-center" {...listeners}>
        <p className="mr-2">
          <VinesLucideIcon className="size-[15px]" size={15} src={EMOJI2LUCIDE_MAPPER[icon] ?? icon} />
        </p>
        <h1 className="whitespace-nowrap text-sm">{t([`workspace.wrapper.space.tabs.${displayName}`, displayName])}</h1>
        <AnimatePresence>
          {isActive && (
            <motion.div
              key={id + '_more_button'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-2"
            >
              <TabMenu />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

SpaceTab.displayName = 'SpaceTab';
