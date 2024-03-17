import React from 'react';

interface IUgcViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  subtitle?: React.ReactNode;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ subtitle }) => {
  return (
    <header className="z-50 flex w-full items-center justify-end px-4 pb-4">
      <div className="flex gap-2">{subtitle}</div>
    </header>
  );
};
