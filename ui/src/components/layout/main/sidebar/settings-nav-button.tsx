import React from 'react';

import { LinkOptions, useLinkProps } from '@tanstack/react-router';

import { cn } from '@/utils';

interface INavButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  icon?: React.ReactNode;
  postfix?: React.ReactNode;
  to?: LinkOptions['to'];
  children: React.ReactNode;
  isActive: boolean;
}

export const SettingsNavButton: React.FC<INavButtonProps> = ({ to, children, icon, postfix, isActive, ...props }) => {
  const { onClick, onFocus, onMouseEnter, onMouseLeave, onTouchStart } = useLinkProps({
    to: to as any,
    activeOptions: { exact: true },
  });

  // TODO: add active style based on tab search param

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
SettingsNavButton.displayName = 'SettingsNavButton';
