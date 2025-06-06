/* eslint-disable react-refresh/only-export-components */
import React from 'react';

import { cva } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';

import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';

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
  onlyShowWorkenchIcon?: boolean;
}
export const SideBarNavItem: React.FC<ISpaceSidebarTabProps> = ({
  children,
  icon,
  displayName,
  onlyShowWorkenchIcon,
  ...attr
}) => {
  return (
    <div className="flex h-full select-none items-center" {...attr}>
      {typeof icon === 'string' ? (
        <VinesLucideIcon className="mr-2 size-[20px] shrink-0" size={20} src={icon} />
      ) : (
        React.createElement(icon, { className: 'mr-2 size-[20px] shrink-0', size: 20 })
      )}
      {!onlyShowWorkenchIcon && (
        <h1 className="line-clamp-1 max-w-12 text-ellipsis whitespace-nowrap text-sm">{displayName}</h1>
      )}
      {!onlyShowWorkenchIcon && children}
    </div>
  );
};
