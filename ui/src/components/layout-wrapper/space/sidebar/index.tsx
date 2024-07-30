import React from 'react';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  return <nav className="flex h-full w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">{children}</nav>;
};
