import React, { useEffect, useRef, useState } from 'react';

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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { get } from 'lodash';
import { FolderIcon, RotateCcw } from 'lucide-react';

import { useSystemConfig } from '@/apis/common';
import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip } from '@/components/ui/tooltip';
import useUrlState from '@/hooks/use-url-state';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { cn } from '@/utils';

import { NavDropdown } from './navTab';
import { SideBarNavItem } from './sideBarNavItem';

const FIXED_GROUP_ID = 'global-design-board';

interface IVirtuaWorkbenchViewGroupListProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
  data: (Omit<IPageGroup, 'pageIds'> & { pages: IPinPage[] })[];
  onReorder?: (newData: (Omit<IPageGroup, 'pageIds'> & { pages: IPinPage[] })[]) => void;
  onResetDefault?: () => void;
}

export const VirtuaWorkbenchViewGroupList: React.FC<IVirtuaWorkbenchViewGroupListProps> = ({
  groupId,
  setGroupId,
  data: initialData,
  onReorder,
  onResetDefault,
}) => {
  const { data: oem } = useSystemConfig();

  const [{ workbenchSidebarMoreAction: urlWorkbenchSidebarMoreAction }] = useUrlState<{
    workbenchSidebarMoreAction?: boolean;
  }>({ workbenchSidebarMoreAction: undefined });

  const density = oem?.theme.density ?? 'default';

  const showMoreAction = urlWorkbenchSidebarMoreAction ?? get(oem, ['theme', 'workbenchSidebarMoreAction'], true);

  const workbenchSidebarToggleGroupDetail = oem?.theme.workbenchSidebarToggleGroupDetail ?? true;

  // 添加本地状态
  const [localData, setLocalData] = useState(initialData);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIconHook = useOnlyShowWorkbenchIcon();

  const onlyShowWorkbenchIcon = workbenchSidebarToggleGroupDetail ? onlyShowWorkbenchIconHook : true;

  // 添加传感器
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

  // 修改拖拽结束事件处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === FIXED_GROUP_ID) return;

    const fixed = localData.find((item) => item.id === FIXED_GROUP_ID);
    const reorderable = localData.filter((item) => item.id !== FIXED_GROUP_ID);

    const oldIndex = reorderable.findIndex((item) => item.id === activeId);
    const newIndex = overId === FIXED_GROUP_ID ? 0 : reorderable.findIndex((item) => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(reorderable, oldIndex, newIndex);
    const newData = fixed ? [fixed, ...reordered] : reordered;

    // 更新本地状态
    setLocalData(newData);

    // 调用外部回调
    onReorder?.(newData);
  };

  return (
    <div className="flex h-full pr-[1px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full flex-col">
          <ScrollArea
            className={cn(
              'min-h-0 flex-1 pt-global',
              density === 'compact' && 'px-global-1/2',
              density === 'default' && 'px-global',
              onlyShowWorkbenchIcon
                ? '[&>*]:w-[calc(var(--global-icon-size)+8px+var(--global-spacing))]'
                : 'min-w-44',
            )}
            ref={scrollRef}
            disabledOverflowMask
          >
            <SortableContext items={localData.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {localData.map(({ displayName, id, iconUrl }) => (
                <SideBarNavItem
                  key={id}
                  icon={iconUrl ?? FolderIcon}
                  groupId={id}
                  displayName={displayName}
                  onlyShowWorkbenchIcon={onlyShowWorkbenchIcon}
                  onClick={() => setGroupId(id)}
                >
                  {showMoreAction && id !== FIXED_GROUP_ID && <NavDropdown groupId={id} />}
                </SideBarNavItem>
              ))}
            </SortableContext>
          </ScrollArea>

          {onResetDefault && (
            <div className={cn('flex w-full pb-global-1/2', onlyShowWorkbenchIcon ? 'justify-center' : '')}>
              <Tooltip content="Reset Default" contentProps={{ side: 'right' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResetDefault();
                  }}
                  className={cn(
                    'flex select-none items-center gap-global-1/2 rounded-md p-global-1/2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    onlyShowWorkbenchIcon
                      ? 'flex size-[var(--operation-bar-width)] items-center justify-center'
                      : 'w-full justify-start px-global-1/2',
                  )}
                >
                  <RotateCcw className="size-icon shrink-0" size={20} />
                  {!onlyShowWorkbenchIcon && <span className="text-sm font-bold">Reset Default</span>}
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
};
