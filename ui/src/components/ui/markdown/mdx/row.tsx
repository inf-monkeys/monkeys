import React from 'react';

interface IMdxRowProps extends React.ComponentPropsWithoutRef<'div'> {}

export const MdxRow: React.FC<IMdxRowProps> = ({ children }) => {
  return <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 xl:max-w-none xl:grid-cols-2">{children}</div>;
};
