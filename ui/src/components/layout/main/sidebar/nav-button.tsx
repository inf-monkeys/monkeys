import React from 'react';

import { LinkOptions, useLinkProps } from '@tanstack/react-router';

import { useCreation } from 'ahooks';

import { cn } from '@/utils';

interface INavButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  icon?: React.ReactNode;
  postfix?: React.ReactNode;
  to?: LinkOptions['to'];
  children: React.ReactNode;
}

export const NavButton: React.FC<INavButtonProps> = ({ to, children, icon, postfix, ...props }) => {
  const { onClick, onFocus, onMouseEnter, onMouseLeave, onTouchStart, ...link } = useLinkProps({
    to: to as any,
    activeOptions: { exact: true },
  });

  const isActive = useCreation(() => {
    const linkHref = link?.href ?? '';
    return (
      link['data-status'] === 'active' ||
      ((linkHref?.split('/').filter(Boolean).length !== 1 && location.pathname?.startsWith(linkHref)) ?? false)
    );
  }, [link]);

  return (
    <div
      className={cn(
        'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg border border-transparent p-2 text-xs hover:border-input/60 hover:bg-mauve-2/60 hover:bg-opacity-70',
        to && isActive ? 'border-input bg-mauve-2 font-bold' : '',
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
      <span className="text-sm">{children}</span>
      {postfix}
    </div>
  );
};
