import React from 'react';

import { Drill } from 'lucide-react';

interface IPage404Props extends React.ComponentPropsWithoutRef<'div'> {
  title?: string;
}

export const Page404: React.FC<IPage404Props> = ({ title }) => {
  return (
    <div className="vines-center pointer-events-none size-full select-none flex-col gap-4">
      <Drill size={64} />
      {title && <h1 className="font-bold">{title}</h1>}
      <h2 className="font-bold">视图正在建设中</h2>
    </div>
  );
};
