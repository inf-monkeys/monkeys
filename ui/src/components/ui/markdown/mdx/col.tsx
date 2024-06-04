import React from 'react';

import { cn } from '@/utils';

interface IMdxColProps extends React.ComponentPropsWithoutRef<'div'> {
  sticky?: boolean;
}

export const MdxCol: React.FC<IMdxColProps> = ({ children, sticky = false }) => {
  return (
    <div className={cn('[&>:first-child]:mt-0 [&>:last-child]:mb-0', sticky && 'xl:sticky xl:top-24')}>{children}</div>
  );
};
