import React from 'react';

import { ApiKey } from '@/components/layout/settings/api-key';
import { PagePermissions } from '@/components/layout/workspace/custom-setting/common/page-permissions.tsx';
import { IFrameEmbed } from '@/components/layout/workspace/custom-setting/common/iframe-embed.tsx';

interface ICommonSettingProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CommonSetting: React.FC<ICommonSettingProps> = () => {
  return (
    <div className="grid grid-cols-2 items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <PagePermissions />
        <IFrameEmbed />
      </div>
      <div className="grid items-start gap-4">
        <ApiKey />
      </div>
    </div>
  );
};
