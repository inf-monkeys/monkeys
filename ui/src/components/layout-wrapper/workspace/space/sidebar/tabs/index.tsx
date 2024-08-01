import React from 'react';

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
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IPageType } from '@/apis/pages/typings.ts';
import { SpaceSidebarTabsList } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';
import { SpaceTab } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { usePageStore } from '@/store/usePageStore';

interface ITabsProps {}

export const SpaceTabs: React.FC<ITabsProps> = () => {
  const { t } = useTranslation();

  const apiDocumentVisible = usePageStore((s) => s.apiDocumentVisible);

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
  const activeIndex = apiDocumentVisible ? -1 : pages?.findIndex(({ id }) => id === pageId) ?? 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      onDragEnd={handleDragEnd}
    >
      <SpaceSidebarTabsList>
        <SortableContext items={pageIds} strategy={verticalListSortingStrategy} disabled={disableDND}>
          {pages?.map(({ id, displayName, instance, customOptions, type }, index) => (
            <SpaceTab
              key={id}
              id={id}
              icon={get(customOptions, 'icon', instance?.icon ?? '⚠️')}
              displayName={displayName ?? t('workspace.wrapper.space.unknown-view')}
              activeIndex={activeIndex}
              index={index}
              type={type}
            />
          ))}
        </SortableContext>
      </SpaceSidebarTabsList>
    </DndContext>
  );
};
