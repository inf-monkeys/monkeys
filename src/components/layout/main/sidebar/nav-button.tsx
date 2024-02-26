import React from 'react';

import { LinkOptions, useLinkProps } from '@tanstack/react-router';

import { cn } from '@/utils';

interface INavButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  icon?: React.ReactNode;
  postfix?: React.ReactNode;
  to?: LinkOptions['to'];
  children: React.ReactNode;
}

export const NavButton: React.FC<INavButtonProps> = ({ to, children, icon, postfix, ...props }) => {
  const { onClick, onFocus, onMouseEnter, onMouseLeave, onTouchStart, ...link } = useLinkProps({
    to,
    activeOptions: { exact: true },
  });

  return (
    <div
      className={cn(
        'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg p-2 text-xs hover:bg-mauve-2 hover:bg-opacity-70',
        to && link['data-status'] === 'active' ? 'bg-mauve-2 font-bold' : '',
      )}
      {...(to &&
        ({
          onClick,
          onFocus,
          onMouseEnter,
          onMouseLeave,
          onTouchStart,
        } as React.ComponentPropsWithoutRef<'div'>))}
      {...props}
    >
      <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]">{icon}</div>
      <span>{children}</span>
      {postfix}
    </div>
  );
};
