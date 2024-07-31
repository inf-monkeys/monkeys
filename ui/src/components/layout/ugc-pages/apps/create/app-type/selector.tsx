import React from 'react';

import { AppTypeItem } from '@/components/layout/ugc-pages/apps/create/app-type/item.tsx';
import { ICreateAppType } from '@/components/layout/ugc-pages/apps/create/app-type/typings.ts';

export const AppTypeSelector: React.FC<{
  selectedType: ICreateAppType;
  onChange: (selected: ICreateAppType) => void | Promise<void>;
}> = ({ selectedType, onChange }) => {
  return (
    <div className="flex justify-between gap-4">
      <AppTypeItem type="agent" selected={selectedType === 'agent'} onSelect={onChange} />
      <AppTypeItem type="workflow" selected={selectedType === 'workflow'} onSelect={onChange} />
    </div>
  );
};
