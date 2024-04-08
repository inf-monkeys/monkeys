import React from 'react';

import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import { DialogTitle } from '@/components/ui/dialog';

interface IExternalAccountManageProps {
  detail: IVinesCredentialType | null;
}

export const ExternalAccountManage: React.FC<IExternalAccountManageProps> = ({ detail }) => {
  return (
    <>
      <DialogTitle>{detail?.displayName}</DialogTitle>
    </>
  );
};
