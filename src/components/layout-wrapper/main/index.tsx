import React from 'react';

interface IMainWrapperProps extends React.ComponentPropsWithoutRef<'div'> {}

export const MainWrapper: React.FC<IMainWrapperProps> = ({ children }) => {
  return <div>{children}</div>;
};
