/* eslint-disable react-refresh/only-export-components */
import React from 'react';

import { cva } from 'class-variance-authority';

import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
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
  icon: string;
  displayName: string;
}
export const SpaceSidebarTabContent: React.FC<ISpaceSidebarTabProps> = ({ children, icon, displayName, ...attr }) => {
  return (
    <div className="flex h-full select-none items-center" {...attr}>
      <p className="mr-2">
        <VinesLucideIcon className="size-[15px]" size={15} src={EMOJI2LUCIDE_MAPPER[icon] ?? icon} />
      </p>
      <h1 className="whitespace-nowrap text-sm">{displayName}</h1>
      {children}
    </div>
  );
};
