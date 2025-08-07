import React, { useContext } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LucideIcon } from 'lucide-react';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { WorkbenchViewItemCurrentData } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { LANGUAGE_MAPPER } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/display-name';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';

interface ISpaceSidebarTabProps extends React.ComponentPropsWithoutRef<'div'> {
  icon: string | LucideIcon;
  displayName: string | Record<string, string>;
  onlyShowWorkbenchIcon?: boolean;
  groupId: string;
}

export const SideBarNavItem: React.FC<ISpaceSidebarTabProps> = ({
  children,
  icon,
  displayName,
  onlyShowWorkbenchIcon,
  groupId,
  ...attr
}) => {
  const { groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);
  const { t, i18n } = useTranslation();
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  
  // 针对LF客户的主题定制
  const isLFTheme = themeMode === 'shadow';
  const backgroundClass = isLFTheme ? 'bg-[#f3f4f6]' : 'bg-neocard';
  // 获取当前语言的显示值

  const displayText = (() => {
    try {
      // @ts-expect-error
      const realDisplayName = JSON.parse(displayName);
      const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'zh-CN';
      const content = realDisplayName[currentLanguageKey];

      // return t([`workspace.wrapper.space.tabs.${content || 'unknown'}`, content || 'Unknown Group']);
      return content;
    } catch {
      return displayName;
    }
  })();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: groupId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const child = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'z-10 flex cursor-pointer select-none items-center gap-global-1/2 rounded-md p-global-1/2 transition-colors hover:bg-accent hover:text-accent-foreground',
        onlyShowWorkbenchIcon
          ? 'flex size-[var(--operation-bar-width)] items-center justify-center'
          : 'mb-global-1/2 flex w-full shrink-0 items-center justify-start gap-global-1/2 px-global-1/2',
        groupId === currentGroupId && cn('group border border-input text-accent-foreground dark:bg-[#393939]', backgroundClass),
      )}
      {...attr}
    >
      {typeof icon === 'string' ? (
        <VinesLucideIcon className="size-icon shrink-0" size={20} src={icon} />
      ) : (
        React.createElement(icon, { className: 'size-icon shrink-0', size: 20 })
      )}
      {!onlyShowWorkbenchIcon && (
        <h1 className="line-clamp-1 max-w-20 text-ellipsis whitespace-nowrap text-sm">{displayText}</h1>
      )}
      {!onlyShowWorkbenchIcon && children}
    </div>
  );

  return onlyShowWorkbenchIcon ? (
    <Tooltip>
      <TooltipTrigger>{child}</TooltipTrigger>
      <TooltipContent>{getI18nContent(displayName)}</TooltipContent>
    </Tooltip>
  ) : (
    child
  );
};
