import React from 'react';

import { PagePermissions } from '@/components/layout/workspace/custom-setting/common/page-permissions.tsx';

interface ICommonSettingProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CommonSetting: React.FC<ICommonSettingProps> = () => {
  return (
    <div className="grid grid-cols-2 items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <PagePermissions />
      </div>
    </div>
  );
};
