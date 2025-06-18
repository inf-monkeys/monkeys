import React from 'react';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  return (
    <nav className="mr-4 mt-4 flex w-56 flex-col justify-between gap-4 overflow-y-hidden rounded-xl border border-input bg-slate-1 p-4">
      {children}
    </nav>
  );
};
