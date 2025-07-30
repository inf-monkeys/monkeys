import React, { useEffect, useRef, useState } from 'react';

import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Separator } from '@radix-ui/react-separator';
import { FolderIcon } from 'lucide-react';

import { useSystemConfig } from '@/apis/common';
import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsHoveringGroup, useOnlyShowWorkbenchIcon, useSetIsHoveringGroup } from '@/store/showWorkbenchIcon';
import { cn } from '@/utils';

import { NavDropdown } from './navTab';
import { SideBarNavItem } from './sideBarNavItem';

interface IVirtuaWorkbenchViewGroupListProps extends React.ComponentPropsWithoutRef<'div'> {
  data: (Omit<IPageGroup, 'pageIds'> & {
    pages: IPinPage[];
  })[];
  groupId: string;
  setGroupId: (groupId: string) => void;
  onReorder?: (
    newData: (Omit<IPageGroup, 'pageIds'> & {
      pages: IPinPage[];
    })[],
  ) => void;
}

export const VirtuaWorkbenchViewGroupList: React.FC<IVirtuaWorkbenchViewGroupListProps> = ({
  groupId,
  setGroupId,
  data: initialData,
  onReorder,
}) => {
  const { data: oem } = useSystemConfig();
  const showMoreAction = oem?.theme.workbenchSidebarMoreAction ?? true;

  // 添加本地状态
  const [localData, setLocalData] = useState(initialData);

  // 当外部数据变化时更新本地状态
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  
  // 新增hover状态管理
  const isHoveringGroup = useIsHoveringGroup();
  const setIsHoveringGroup = useSetIsHoveringGroup();

  // 添加传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
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

    const oldIndex = localData.findIndex((item) => item.id === active.id);
    const newIndex = localData.findIndex((item) => item.id === over.id);

    const newData = arrayMove(localData, oldIndex, newIndex);

    // 更新本地状态
    setLocalData(newData);

    // 调用外部回调
    onReorder?.(newData);
  };

  // 处理hover事件
  const handleMouseEnter = () => {
    setIsHoveringGroup(true);
  };

  const handleMouseLeave = () => {
    setIsHoveringGroup(false);
  };

  return (
    <div 
      className="flex h-full pr-[1px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea
          className={cn(
            'h-full px-global pt-global',
            onlyShowWorkbenchIcon ? '[&>*]:w-[calc(var(--global-icon-size)+8px+var(--global-spacing))]' : 'min-w-44',
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
                {showMoreAction && <NavDropdown groupId={id} />}
              </SideBarNavItem>
            ))}
          </SortableContext>
        </ScrollArea>
        <Separator orientation="vertical" />
      </DndContext>
    </div>
  );
};
