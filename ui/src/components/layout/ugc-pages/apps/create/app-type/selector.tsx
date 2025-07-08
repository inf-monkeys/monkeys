import React from 'react';

import { AppTypeItem } from '@/components/layout/ugc-pages/apps/create/app-type/item.tsx';
import { ICreateAppType } from '@/components/layout/ugc-pages/apps/create/app-type/typings.ts';

export const AppTypeSelector: React.FC<{
  selectedType: ICreateAppType;
  onChange: (selected: ICreateAppType) => void | Promise<void>;
}> = ({ selectedType, onChange }) => {
  return (
    <div className="gap-global flex justify-between">
      <AppTypeItem type="agent" selected={selectedType === 'agent'} onSelect={onChange} />
      <AppTypeItem type="workflow" selected={selectedType === 'workflow'} onSelect={onChange} />
    </div>
  );
};
