import React from 'react';

import { TabsTrigger } from '@/components/ui/tabs.tsx';

interface IVirtuaDatabaseTableListItemProps {
  name: string;
}

export const VirtuaDatabaseTableListItem: React.FC<IVirtuaDatabaseTableListItemProps> = ({ name }) => {
  return (
    <TabsTrigger
      value={name}
      className="mb-2 h-10 w-full justify-start data-[state=active]:border data-[state=active]:border-input data-[state=active]:font-normal"
    >
      {name}
    </TabsTrigger>
  );
};
