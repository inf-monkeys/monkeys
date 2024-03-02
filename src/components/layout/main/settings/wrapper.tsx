import React from 'react';

interface ISettingsWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SettingsWrapper: React.FC<ISettingsWrapperProps> = ({ children }) => {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col items-center overflow-y-auto text-xs">{children}</div>
    </div>
  );
};
