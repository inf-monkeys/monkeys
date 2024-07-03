import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor, restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IPageType } from '@/apis/pages/typings.ts';
import { Expand } from '@/components/layout-wrapper/workspace/space/tabs/expand';
import { SpaceTab } from '@/components/layout-wrapper/workspace/space/tabs/tab.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { cn } from '@/utils';

interface ITabsProps {}

export const SpaceTabs: React.FC<ITabsProps> = () => {
  const { t } = useTranslation();

  const { workflow } = useVinesPage();

  const { pages, setPages, page, pageId } = useVinesPage();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const headerNode = useRef<HTMLDivElement>(null);
  const tabsNode = useRef<HTMLDivElement>(null);
  const [scrollToolVisible, setScrollToolVisible] = useState(false);

  const handleVisibilityChange = useCallback(
    debounce(() => {
      const tabsEl = tabsNode.current;
      const headerEl = headerNode.current;
      setScrollToolVisible((tabsEl?.offsetWidth ?? 0) > (headerEl?.offsetWidth ?? 0) - 120);
    }, 100),
    [],
  );

  useLayoutEffect(() => {
    window.addEventListener('resize', handleVisibilityChange);
    return () => {
      window.removeEventListener('resize', handleVisibilityChange);
    };
  }, [tabsNode]);

  useEffect(() => {
    handleVisibilityChange();
  }, [pages]);

  const pageIds = pages?.map(({ id }) => id) ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !pages) return;

    if (active.id !== over.id) {
      const oldIndex = pageIds.indexOf(active.id as string);
      const newIndex = pageIds.indexOf(over.id as string);
      const newPages = arrayMove(pages, oldIndex, newIndex) as IPageType[];
      newPages.forEach((page, index) => {
        page.sortIndex = index + 1;
      });
      void setPages(newPages);
    }
  };

  const pageLength = pages?.length ?? 0;
  const disableDND = pageLength === 1;
  const pageNavLastIndex = pageLength - 1;
  const activeIndex = pages?.findIndex(({ id }) => id === pageId) ?? 0;

  const openAIInterfaceEnabled = workflow?.exposeOpenaiCompatibleInterface ?? false;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis, restrictToFirstScrollableAncestor]}
      onDragEnd={handleDragEnd}
    >
      <header ref={headerNode} className="relative z-20 mx-3 mt-2 flex h-10 overflow-x-clip scroll-smooth">
        <div ref={tabsNode} className={cn('flex overflow-hidden', scrollToolVisible && 'pr-32')}>
          <SortableContext items={pageIds} strategy={horizontalListSortingStrategy} disabled={disableDND}>
            {pages
              ?.filter((it) => (openAIInterfaceEnabled ? it.type !== 'preview' : true))
              ?.map(({ id, displayName, instance }, index) => (
                <SpaceTab
                  key={id}
                  id={id}
                  icon={instance?.icon ?? '⚠️'}
                  displayName={displayName ?? t('workspace.wrapper.space.unknown-view')}
                  activeIndex={activeIndex}
                  isLastItem={pageNavLastIndex !== index}
                  index={index}
                  pages={pages}
                  page={page}
                />
              ))}
          </SortableContext>
        </div>
        <Expand visible={scrollToolVisible} tabsNode={tabsNode} />
      </header>
    </DndContext>
  );
};
