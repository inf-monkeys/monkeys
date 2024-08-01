import React, { memo, useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { useSortable } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { IPageInstanceType } from '@/apis/pages/typings.ts';
import { useGetWorkflow } from '@/apis/workflow';
import { SpaceSidebarTabContent, spaceSidebarTabVariants } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';
import { TabMenu } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

export const EMOJI2LUCIDE_MAPPER = {
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
  type: IPageInstanceType;
}

export const SpaceTab: React.FC<ISpaceTabProps> = memo(({ id, displayName, icon, activeIndex, index, type }) => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });

  const setApiDocumentVisible = usePageStore((s) => s.setApiDocumentVisible);

  const [disabled, setDisabled] = useState(false);

  const { setNodeRef, listeners, attributes, transform, isDragging } = useSortable({ id, disabled });

  const active = activeIndex === index;

  const handleChangePage = () => {
    if (!active) {
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

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });
  const { data: workflow } = useGetWorkflow(workflowId);
  const disableFormView = (workflow?.exposeOpenaiCompatibleInterface ?? false) && type === 'preview';

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(spaceSidebarTabVariants(active ? { status: 'active' } : {}), disableFormView && 'hidden')}
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
      <SpaceSidebarTabContent
        icon={icon}
        displayName={t([`workspace.wrapper.space.tabs.${displayName}`, displayName])}
        {...listeners}
      >
        <AnimatePresence>
          {active && (
            <motion.div
              key={id + '_more_button'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-2"
            >
              <TabMenu onOpenChange={(status) => setDisabled(status)} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpaceSidebarTabContent>
    </motion.div>
  );
});

SpaceTab.displayName = 'SpaceTab';
