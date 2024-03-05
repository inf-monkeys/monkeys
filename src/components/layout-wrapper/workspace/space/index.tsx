import React from 'react';

import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/tabs';

interface ISpaceProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Space: React.FC<ISpaceProps> = ({ children }) => {
  return (
    <>
      <SpaceTabs />
      {children}
    </>
  );
};
