import React from 'react';

import { IAssetCustomProps } from '@/components/layout/ugc/typings.ts';
import { UgcHeaderDisplayModeButton } from '@/components/layout/ugc/view/header/display-mode.tsx';
import { UgcHeaderSortButton } from '@/components/layout/ugc/view/header/sort.tsx';

interface IUgcViewHeaderProps extends IAssetCustomProps {
  assetKey: string;
  subtitle?: React.ReactNode;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, subtitle }) => {
  return (
    <header className="flex w-full items-center justify-end px-4 pb-2">
      <div className="flex gap-2">
        <UgcHeaderDisplayModeButton assetKey={assetKey} />
        <UgcHeaderSortButton assetKey={assetKey} />
        {subtitle}
      </div>
    </header>
  );
};
