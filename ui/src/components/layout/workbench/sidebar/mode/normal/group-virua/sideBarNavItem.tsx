/* eslint-disable react-refresh/only-export-components */
import React, { useContext } from 'react';

import { cva } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';

import { WorkbenchViewItemCurrentData } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn } from '@/utils';

interface ISidebarTabsListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebarTabsList: React.FC<ISidebarTabsListProps> = ({ children }) => {
  return <div className="relative z-20 flex w-full flex-col gap-1 scroll-smooth">{children}</div>;
};

export const spaceSidebarTabVariants = cva(
  'relative w-full cursor-pointer select-none items-center rounded-md border border-transparent p-2 text-sm hover:bg-mauve-2 hover:bg-opacity-70',
  {
    variants: {
      status: {
        active: '!border-input bg-mauve-2 font-medium',
      },
    },
  },
);

interface ISpaceSidebarTabProps extends React.ComponentPropsWithoutRef<'div'> {
  icon: string | LucideIcon;
  displayName: string;
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

  return (
    <div
      className={cn(
        'z-10 mb-1 flex h-11 cursor-pointer select-none items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
        onlyShowWorkbenchIcon
          ? 'flex size-11 items-center justify-center'
          : 'flex w-full shrink-0 items-center justify-start gap-2 px-2',
        groupId === currentGroupId && 'group border border-input bg-neocard text-accent-foreground dark:bg-[#393939]',
      )}
      {...attr}
    >
      {typeof icon === 'string' ? (
        <VinesLucideIcon className="size-[20px] shrink-0" size={20} src={icon} />
      ) : (
        React.createElement(icon, { className: 'size-[20px] shrink-0', size: 20 })
      )}
      {!onlyShowWorkbenchIcon && (
        <h1 className="line-clamp-1 max-w-20 text-ellipsis whitespace-nowrap text-sm">{displayName}</h1>
      )}
      {!onlyShowWorkbenchIcon && children}
    </div>
  );
};
