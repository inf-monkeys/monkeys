import React from 'react';

interface INavButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  icon?: React.ReactNode;
  postfix?: React.ReactNode;
}

export const NavButton: React.FC<INavButtonProps> = ({ children, icon, postfix }) => {
  return (
    <div className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-xs hover:bg-whiteA-10 hover:bg-opacity-10">
      <div className="w-[20px] [&>*]:h-[16px] [&>*]:w-[16px]">{icon}</div>
      <span>{children}</span>
      {postfix}
    </div>
  );
};
