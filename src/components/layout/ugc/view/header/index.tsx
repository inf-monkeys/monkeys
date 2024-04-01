import React from 'react';

import { IAssetCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterButtonProps, UgcViewFilterButton } from '@/components/layout/ugc/view/filter/button';
import { UgcHeaderDisplayModeButton } from '@/components/layout/ugc/view/header/display-mode.tsx';
import { UgcHeaderSortButton } from '@/components/layout/ugc/view/header/sort.tsx';

interface IUgcViewHeaderProps extends IAssetCustomProps {
  subtitle?: React.ReactNode;
  filterProps: Omit<IUgcViewFilterButtonProps, keyof IAssetCustomProps>;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, assetType, filterProps, subtitle }) => {
  return (
    <header className="flex w-full items-center justify-end px-4 pb-2">
      <div className="flex gap-2">
        <UgcHeaderDisplayModeButton assetKey={assetKey} />
        <UgcHeaderSortButton assetKey={assetKey} assetType={assetType} />
        <UgcViewFilterButton assetKey={assetKey} assetType={assetType} {...filterProps} />
        {subtitle}
      </div>
    </header>
  );
};
